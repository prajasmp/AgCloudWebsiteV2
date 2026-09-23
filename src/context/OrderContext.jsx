import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const OrderContext = createContext();

const MOCK_INITIAL_ORDERS = [
  {
    id: 'ord_98412a0f',
    userId: 'user_demo123',
    userName: 'Rohan Sharma',
    userEmail: 'rohan.game@gmail.com',
    planId: 'ryzen-8gb',
    category: 'ryzen',
    planName: 'Ryzen Plan 8 GB',
    amount: 880,
    payerName: 'Rohan Sharma',
    transactionId: 'UPI984102948123',
    serverName: 'CraftLand India SMP',
    deliveryEmail: 'rohan.game@gmail.com',
    discordTicket: 'ticket-1042',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('ag_cloud_orders');
    return saved ? JSON.parse(saved) : MOCK_INITIAL_ORDERS;
  });

  useEffect(() => {

    const fetchSupabaseOrders = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (data && !error) {
            const formatted = data.map(row => ({
              id: row.id,
              userId: row.user_id,
              userName: row.user_name,
              userEmail: row.user_email,
              planId: row.plan_id,
              planName: row.plan_name,
              amount: row.amount,
              payerName: row.payer_name,
              transactionId: row.transaction_id,
              serverName: row.server_name,
              deliveryEmail: row.delivery_email,
              discordTicket: row.discord_ticket,
              status: row.status,
              createdAt: row.created_at
            }));
            setOrders(formatted);
          }
        } catch (err) {
          console.error('Supabase fetch error:', err);
        }
      }
    };

    fetchSupabaseOrders();
  }, []);

  useEffect(() => {
    localStorage.setItem('ag_cloud_orders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = async (newOrder) => {
    const orderId = 'ord_' + Math.random().toString(36).substr(2, 8);
    const createdAt = new Date().toISOString();

    const createdOrder = {
      id: orderId,
      createdAt,
      status: 'pending',
      ...newOrder
    };

    setOrders(prev => [createdOrder, ...prev]);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').insert({
          id: orderId,
          user_id: newOrder.userId,
          user_name: newOrder.userName,
          user_email: newOrder.userEmail,
          plan_id: newOrder.planId,
          plan_name: newOrder.planName,
          amount: newOrder.amount,
          payer_name: newOrder.payerName,
          transaction_id: newOrder.transactionId,
          server_name: newOrder.serverName,
          delivery_email: newOrder.deliveryEmail,
          discord_ticket: newOrder.discordTicket,
          status: 'pending',
          created_at: createdAt
        });
      } catch (err) {
        console.error('Supabase insert error:', err);
      }
    }

    return createdOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus, reviewedAt: new Date().toISOString() } : o))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('orders')
          .update({ status: newStatus, reviewed_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (err) {
        console.error('Supabase status update error:', err);
      }
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}
