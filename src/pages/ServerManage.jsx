import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  fetchServerDetails, fetchServerConsoleToken, sendServerAction, sendConsoleCommand,
  fetchServerFiles, readServerFile, writeServerFile, createServerFolder,
  renameServerFile, deleteServerFile, renameServerName
} from '../services/api';
import {
  Server, Play, Square, RotateCw, AlertTriangle, ArrowLeft,
  Terminal, Folder, FileText, Upload, Plus, Edit, Trash2,
  RefreshCw, Network, Settings, Cpu, HardDrive, Zap, Check,
  Sparkles, ShieldCheck, Download, AlertOctagon, Wifi, WifiOff, Loader2
} from 'lucide-react';

export default function ServerManage() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState('overview');

  const [server, setServer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  const [consoleLogs, setConsoleLogs] = useState([]);
  const [commandInput, setCommandInput] = useState('');
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [wsError, setWsError] = useState('');
  const socketRef = useRef(null);
  const consoleEndRef = useRef(null);

  const [currentDir, setCurrentDir] = useState('/');
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [editorLoading, setEditorLoading] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);

  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [pluginFiles, setPluginFiles] = useState([]);
  const [pluginsLoading, setPluginsLoading] = useState(false);

  const [editServerName, setEditServerName] = useState('');

  const loadServerDetails = async () => {
    if (!serverId) return;
    try {
      const res = await fetchServerDetails(serverId);
      setServer(res.server);
      setStats(res.stats);
      if (!editServerName && res.server?.server_name) {
        setEditServerName(res.server.server_name);
      }
    } catch (err) {
      console.error('Failed to load server details:', err);
      setErrorMsg(err.message || 'Failed to load server details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && serverId) {
      loadServerDetails();
    }
  }, [user, serverId]);

  useEffect(() => {
    if (!serverId || activeTab !== 'overview' || loading) return;
    const interval = setInterval(() => {
      loadServerDetails();
    }, 8000);
    return () => clearInterval(interval);
  }, [serverId, activeTab, loading]);

  useEffect(() => {
    if (activeTab !== 'console' || !user || !serverId) return;

    let isSubscribed = true;
    let socket = null;

    setWsStatus('connecting');
    setWsError('');
    setConsoleLogs([
      `[System/INFO]: Authenticating Firebase user session & requesting console WebSocket token for server "${serverId}"...`
    ]);

    fetchServerConsoleToken(serverId)
      .then(wsData => {
        if (!isSubscribed) return;

        if (!wsData || !wsData.socket || !wsData.token) {
          throw new Error('Server returned invalid WebSocket token authorization payload.');
        }

        setConsoleLogs(prev => [
          ...prev,
          `[System/INFO]: Connecting to Pterodactyl Wings WebSocket (${wsData.socket})...`
        ]);

        socket = new WebSocket(wsData.socket);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isSubscribed) return;

          socket.send(JSON.stringify({ event: 'auth', args: [wsData.token] }));
        };

        socket.onmessage = (evt) => {
          if (!isSubscribed) return;
          try {
            const payload = JSON.parse(evt.data);
            if (payload.event === 'auth success') {
              setWsStatus('connected');
              setConsoleLogs(prev => [
                ...prev,
                '[System/INFO]: Pterodactyl WebSocket Authentication Success! Streaming live Minecraft console logs.'
              ]);
            } else if (payload.event === 'console output') {
              const rawText = payload.args[0] || '';

              const cleanText = rawText.replace(/\u001b\[[0-9;]*[mGK]/g, '');
              setConsoleLogs(prev => [...prev, cleanText]);
            } else if (payload.event === 'status') {
              setConsoleLogs(prev => [...prev, `[System/INFO]: Server state changed to "${payload.args[0]}".`]);
            } else if (payload.event === 'token expiring') {
              fetchServerConsoleToken(serverId).then(newTokenData => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ event: 'auth', args: [newTokenData.token] }));
                }
              }).catch(() => {});
            }
          } catch (e) {
            setConsoleLogs(prev => [...prev, evt.data]);
          }
        };

        socket.onerror = (err) => {
          if (!isSubscribed) return;
          setWsStatus('error');
          setWsError('Pterodactyl WebSocket connection error. Verify panel status & server container state.');
          setConsoleLogs(prev => [...prev, '[Console Error]: Pterodactyl WebSocket connection error.']);
        };

        socket.onclose = () => {
          if (!isSubscribed) return;
          setWsStatus('disconnected');
          setConsoleLogs(prev => [...prev, '[System/INFO]: Live console WebSocket session disconnected.']);
        };
      })
      .catch(err => {
        if (!isSubscribed) return;
        setWsStatus('error');
        setWsError(err.message || 'Failed to authorize console session.');
        setConsoleLogs(prev => [
          ...prev,
          `[Console Error]: Real Pterodactyl WebSocket connection failed: ${err.message}`
        ]);
      });

    return () => {
      isSubscribed = false;
      if (socket) {
        socket.close();
      }
      socketRef.current = null;
    };
  }, [activeTab, user, serverId]);

  useEffect(() => {
    if (activeTab === 'console' && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, activeTab]);

  const handlePowerAction = async (action) => {
    setActionInProgress(action);
    setErrorMsg('');
    try {
      await sendServerAction(serverId, action);
      const logText = action === 'start' ? 'Server start signal sent.' : action === 'stop' ? 'Server stop signal sent.' : action === 'restart' ? 'Server restart signal sent.' : 'Emergency force kill signal sent.';
      setConsoleLogs(prev => [...prev, `[System/INFO]: ${logText}`]);
      await loadServerDetails();
    } catch (err) {
      setErrorMsg(err.message || `Failed to perform ${action} action`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();
    setCommandInput('');

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event: 'send command', args: [cmd] }));
    } else {

      try {
        await sendConsoleCommand(serverId, cmd);
        setConsoleLogs(prev => [...prev, `> ${cmd}`]);
      } catch (err) {
        setConsoleLogs(prev => [...prev, `[System/ERROR]: Command execution failed: ${err.message}`]);
      }
    }
  };

  const loadFiles = async (dir = currentDir) => {
    setFilesLoading(true);
    try {
      const res = await fetchServerFiles(serverId, dir);
      setFiles(res.files || []);
      setCurrentDir(res.directory || dir);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to list directory files.');
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'files') {
      loadFiles(currentDir);
    }
  }, [activeTab, currentDir]);

  const loadPluginFiles = async () => {
    setPluginsLoading(true);
    try {
      const res = await fetchServerFiles(serverId, '/plugins');
      setPluginFiles(res.files || []);
    } catch (err) {
      console.warn('Plugins directory list warning:', err.message);
      setPluginFiles([]);
    } finally {
      setPluginsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'plugins') {
      loadPluginFiles();
    }
  }, [activeTab]);

  const handleOpenFile = async (item) => {
    if (!item.isFile) {
      const newPath = currentDir === '/' ? `/${item.name}` : `${currentDir}/${item.name}`;
      setCurrentDir(newPath);
      return;
    }

    const fullPath = currentDir === '/' ? `/${item.name}` : `${currentDir}/${item.name}`;
    setSelectedFile(fullPath);
    setEditorLoading(true);
    setShowEditorModal(true);

    try {
      const res = await readServerFile(serverId, fullPath);
      setFileContent(res.content || '');
    } catch (err) {
      setFileContent(`# Unable to load contents of ${fullPath}\n# Error: ${err.message}`);
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setEditorLoading(true);
    try {
      await writeServerFile(serverId, selectedFile, fileContent);
      setShowEditorModal(false);
      await loadFiles(currentDir);
    } catch (err) {
      alert(`Save file failed: ${err.message}`);
    } finally {
      setEditorLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createServerFolder(serverId, currentDir, newFolderName.trim());
      setNewFolderName('');
      setShowFolderModal(false);
      await loadFiles(currentDir);
    } catch (err) {
      alert(`Create folder failed: ${err.message}`);
    }
  };

  const handleRenameFile = async (e) => {
    e.preventDefault();
    if (!renameTarget || !newFileName.trim()) return;
    try {
      await renameServerFile(serverId, currentDir, renameTarget.name, newFileName.trim());
      setRenameTarget(null);
      setNewFileName('');
      setShowRenameModal(false);
      await loadFiles(currentDir);
    } catch (err) {
      alert(`Rename failed: ${err.message}`);
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteTarget) return;
    try {
      await deleteServerFile(serverId, currentDir, deleteTarget.name);
      setDeleteTarget(null);
      setShowDeleteModal(false);
      await loadFiles(currentDir);
      if (activeTab === 'plugins') {
        await loadPluginFiles();
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editServerName.trim()) return;
    try {
      await renameServerName(serverId, editServerName.trim());
      await loadServerDetails();
      alert('Server display name updated successfully!');
    } catch (err) {
      alert(`Update name failed: ${err.message}`);
    }
  };

  if (authLoading || loading) {
    return <div className="page-loader">Loading Server Control Panel...</div>;
  }

  if (!user || !server) {
    return (
      <div className="container text-center section top-space">
        <h2>Server Not Found or Access Denied</h2>
        <p className="text-muted mb-4">You do not have permission to view this server.</p>
        <Link to="/panel" className="primary-btn glow-btn small">Return to My Servers</Link>
      </div>
    );
  }

  const memoryBytes = stats?.resources?.memoryBytes || 0;
  const memoryMbUsed = Math.round(memoryBytes / (1024 * 1024));
  const memoryLimitMb = server.memory_mb || 4096;
  const cpuPercent = stats?.resources?.cpuAbsolute || 0;
  const diskBytes = stats?.resources?.diskBytes || 0;
  const diskGbUsed = (diskBytes / (1024 * 1024 * 1024)).toFixed(2);
  const diskLimitGb = Math.round((server.disk_mb || 20480) / 1024);
  const networkRxMb = (stats?.resources?.networkRxBytes / (1024 * 1024)).toFixed(1);
  const networkTxMb = (stats?.resources?.networkTxBytes / (1024 * 1024)).toFixed(1);
  const serverStatus = stats?.currentState || server.status || 'running';

  const formatUptime = (seconds) => {
    if (!seconds) return 'Offline';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <section className="section top-space">
      <div className="container">

        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/panel" style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to My Servers
          </Link>
        </div>

        <div className="glass-card glow-border" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge-subtitle" style={{ fontSize: '0.75rem' }}>
                Pterodactyl Container #{server.panel_server_id}
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
                {server.server_name}
              </h1>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code>{server.ip || '103.195.100.42'}:{server.port || 25565}</code>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className={`status-pill ${serverStatus}`} style={{ textTransform: 'capitalize', fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                ● {serverStatus}
              </span>
              <button type="button" onClick={loadServerDetails} className="secondary-btn small" title="Refresh Stats">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.88rem' }}>
              <AlertTriangle size={15} style={{ display: 'inline', marginRight: '0.4rem' }} />
              {errorMsg}
            </div>
          )}
        </div>

        <div className="method-tabs mb-4" style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Zap size={16} /> Overview
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => setActiveTab('console')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Terminal size={16} /> Console Logs
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Folder size={16} /> Files Manager
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'plugins' ? 'active' : ''}`}
            onClick={() => setActiveTab('plugins')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={16} /> Plugins / Extensions
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Network size={16} /> Network
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Settings size={16} /> Settings
          </button>
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>

            <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>Server Power Actions</strong>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Send real-time power control signals to your Minecraft container.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  disabled={Boolean(actionInProgress)}
                  onClick={() => handlePowerAction('start')}
                  className="primary-btn small glow-btn"
                  style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.5)', padding: '0.6rem 1.25rem' }}
                >
                  <Play size={16} /> Start
                </button>
                <button
                  disabled={Boolean(actionInProgress)}
                  onClick={() => handlePowerAction('restart')}
                  className="primary-btn small glow-btn"
                  style={{ background: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.5)', padding: '0.6rem 1.25rem' }}
                >
                  <RotateCw size={16} /> Restart
                </button>
                <button
                  disabled={Boolean(actionInProgress)}
                  onClick={() => handlePowerAction('stop')}
                  className="secondary-btn small"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '0.6rem 1.25rem' }}
                >
                  <Square size={16} /> Stop
                </button>
                <button
                  disabled={Boolean(actionInProgress)}
                  onClick={() => handlePowerAction('kill')}
                  className="secondary-btn small"
                  style={{ background: 'rgba(225, 29, 72, 0.3)', color: '#fda4af', borderColor: 'rgba(225, 29, 72, 0.6)', padding: '0.6rem 1rem' }}
                  title="Emergency Force Kill"
                >
                  <AlertOctagon size={16} /> Kill
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

              <div className="glass-card glow-border" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>CPU Load</span>
                  <Cpu size={18} className="text-cyan" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8' }}>
                  {cpuPercent.toFixed(1)}%
                </div>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                  Limit: {server.cpu_percent}% CPU Allocation
                </p>
              </div>

              <div className="glass-card glow-border" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>Memory (RAM)</span>
                  <Zap size={18} className="text-cyan" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>
                  {(memoryMbUsed / 1024).toFixed(2)} GB
                </div>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                  Max: {Math.round(memoryLimitMb / 1024)} GB ({memoryMbUsed} MB / {memoryLimitMb} MB)
                </p>
              </div>

              <div className="glass-card glow-border" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>Disk Storage</span>
                  <HardDrive size={18} className="text-cyan" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>
                  {diskGbUsed} GB
                </div>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                  Max: {diskLimitGb} GB NVMe SSD
                </p>
              </div>

              <div className="glass-card glow-border" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>Network Traffic</span>
                  <Network size={18} className="text-cyan" />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                  <span>↓ {networkRxMb} MB</span>
                  <span>↑ {networkTxMb} MB</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                  Uptime: {formatUptime(stats?.resources?.uptime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="glass-card glow-border" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Terminal size={18} className="text-cyan" />
                <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>Live Minecraft Terminal Console</strong>

                <span className={`status-badge ${wsStatus === 'connected' ? 'online' : wsStatus === 'connecting' ? 'pending' : 'offline'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <span className="dot" />
                  {wsStatus === 'connected' && 'Live Wings WS'}
                  {wsStatus === 'connecting' && 'Connecting...'}
                  {wsStatus === 'disconnected' && 'Disconnected'}
                  {wsStatus === 'error' && 'Connection Error'}
                </span>
              </div>

              <button type="button" onClick={() => setConsoleLogs([])} className="ghost-btn small" style={{ fontSize: '0.78rem' }}>
                Clear Terminal
              </button>
            </div>

            {wsError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                <strong>Pterodactyl Error:</strong> {wsError}
              </div>
            )}

            <div style={{ background: '#020617', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '1rem', height: '380px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.5' }}>
              {consoleLogs.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>Console log buffer empty...</div>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.startsWith('>') ? '#38bdf8' : log.includes('ERROR') || log.includes('Error') ? '#f87171' : log.includes('WARN') ? '#fbbf24' : log.includes('INFO') ? '#94a3b8' : '#e2e8f0', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {log}
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>

            <form onSubmit={handleCommandSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                placeholder="Enter Minecraft console command... (e.g. list, op username, say Hello)"
                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f8fafc', fontSize: '0.9rem' }}
              />
              <button type="submit" className="primary-btn glow-btn small" style={{ padding: '0.75rem 1.5rem' }}>
                Send Command
              </button>
            </form>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="glass-card glow-border" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Current Directory:</span>
                <code style={{ color: '#38bdf8', fontSize: '0.95rem', fontWeight: 800 }}>{currentDir}</code>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {currentDir !== '/' && (
                  <button
                    type="button"
                    onClick={() => {
                      const parts = currentDir.split('/').filter(Boolean);
                      parts.pop();
                      setCurrentDir(parts.length === 0 ? '/' : `/${parts.join('/')}`);
                    }}
                    className="secondary-btn small"
                  >
                    ← Up One Level
                  </button>
                )}
                <button type="button" onClick={() => loadFiles(currentDir)} className="secondary-btn small">
                  <RefreshCw size={14} /> Refresh
                </button>
                <button type="button" onClick={() => setShowFolderModal(true)} className="primary-btn small glow-btn">
                  <Plus size={14} /> New Folder
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
              {filesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading files...</div>
              ) : files.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>This directory is empty.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Modified</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenFile(item)}
                            style={{ background: 'none', border: 'none', color: item.isFile ? '#f8fafc' : '#38bdf8', fontWeight: item.isFile ? 400 : 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            {item.isFile ? <FileText size={16} className="text-cyan" /> : <Folder size={16} style={{ color: '#38bdf8' }} />}
                            {item.name}
                          </button>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                          {item.isFile ? `${(item.size / 1024).toFixed(1)} KB` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {new Date(item.modifiedAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => { setRenameTarget(item); setNewFileName(item.name); setShowRenameModal(true); }}
                            className="ghost-btn small"
                            title="Rename"
                            style={{ padding: '0.3rem' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeleteTarget(item); setShowDeleteModal(true); }}
                            className="ghost-btn small"
                            title="Delete"
                            style={{ padding: '0.3rem', color: '#f87171' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'plugins' && (
          <div className="glass-card glow-border" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>Plugins & Extensions Manager</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Manage Minecraft server plugins located in the <code>/plugins</code> folder.</p>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.85rem 1.15rem', borderRadius: '8px', fontSize: '0.85rem', color: '#e2e8f0' }}>
              💡 <strong>Notice:</strong> Plugin files (<code>.jar</code>) require server software supporting plugins (Paper, Spigot, Purpur). After uploading or deleting plugins, <strong>restart your server</strong> to apply changes.
            </div>

            <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
              {pluginsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading plugins...</div>
              ) : pluginFiles.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No plugins installed in <code>/plugins</code> directory.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Plugin File</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pluginFiles.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                        <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Sparkles size={16} className="text-cyan" /> <strong>{p.name}</strong>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{(p.size / 1024).toFixed(1)} KB</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => { setDeleteTarget(p); setCurrentDir('/plugins'); setShowDeleteModal(true); }}
                            className="secondary-btn small"
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                          >
                            <Trash2 size={14} /> Remove Plugin
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="glass-card glow-border" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>Network Allocation</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Network connection ports assigned to your Minecraft server container.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '10px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Primary IP Address:</span>
                <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{server.ip || '103.195.100.42'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Primary Port:</span>
                <strong style={{ color: '#f8fafc', fontSize: '1.1rem' }}>{server.port || 25565}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Node ID:</span>
                <strong style={{ color: '#f8fafc', fontSize: '1.1rem' }}>Node #{server.node_id || 1}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-card glow-border" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>Server Display Settings</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Rename your server display name or view plan allocation boundaries.</p>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
              <label>
                Server Name *
                <input
                  type="text"
                  value={editServerName}
                  onChange={e => setEditServerName(e.target.value)}
                  required
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.75rem 1rem', color: '#f8fafc', borderRadius: '8px', width: '100%', marginTop: '0.4rem' }}
                />
              </label>

              <button type="submit" className="primary-btn glow-btn small" style={{ alignSelf: 'flex-start' }}>
                Save Server Name
              </button>
            </form>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
              <h4 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '0.5rem' }}>Plan Resource Limits (Uneditable)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                <div>RAM: <strong>{Math.round(server.memory_mb / 1024)} GB ({server.memory_mb} MB)</strong></div>
                <div>Storage: <strong>{Math.round(server.disk_mb / 1024)} GB NVMe</strong></div>
                <div>CPU: <strong>{server.cpu_percent}% CPU</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditorModal && (
        <div className="payment-modal-overlay">
          <div className="glass-card" style={{ maxWidth: '700px', width: '92%', padding: '1.5rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Editing: <code>{selectedFile}</code></h3>
              <button type="button" onClick={() => setShowEditorModal(false)} className="ghost-btn small">✕</button>
            </div>

            {editorLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading file contents...</div>
            ) : (
              <>
                <textarea
                  value={fileContent}
                  onChange={e => setFileContent(e.target.value)}
                  style={{ flex: 1, minHeight: '320px', background: '#020617', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.88rem', padding: '1rem', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={handleSaveFile} className="primary-btn glow-btn small">Save File</button>
                  <button type="button" onClick={() => setShowEditorModal(false)} className="secondary-btn small">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="payment-modal-overlay">
          <form onSubmit={handleCreateFolder} className="glass-card" style={{ maxWidth: '420px', width: '90%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1rem' }}>Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              required
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.75rem', color: '#f8fafc', borderRadius: '8px', marginBottom: '1.25rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-btn glow-btn small">Create Folder</button>
              <button type="button" onClick={() => setShowFolderModal(false)} className="secondary-btn small">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showRenameModal && (
        <div className="payment-modal-overlay">
          <form onSubmit={handleRenameFile} className="glass-card" style={{ maxWidth: '420px', width: '90%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1rem' }}>Rename Item</h3>
            <input
              type="text"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              required
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.75rem', color: '#f8fafc', borderRadius: '8px', marginBottom: '1.25rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-btn glow-btn small">Rename</button>
              <button type="button" onClick={() => setShowRenameModal(false)} className="secondary-btn small">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="payment-modal-overlay">
          <div className="glass-card text-center" style={{ maxWidth: '420px', width: '90%', padding: '1.5rem' }}>
            <AlertTriangle size={40} className="text-red-icon" style={{ margin: '0 auto 0.75rem', color: '#ef4444' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>Confirm Delete</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" onClick={handleDeleteFile} className="primary-btn glow-btn small" style={{ background: 'rgba(239,68,68,0.8)', borderColor: '#ef4444' }}>
                Delete
              </button>
              <button type="button" onClick={() => setShowDeleteModal(false)} className="secondary-btn small">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
