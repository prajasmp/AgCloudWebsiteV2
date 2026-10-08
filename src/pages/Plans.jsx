import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ALL_PLANS, CATEGORIES, CATEGORY_GROUPS } from '../data/plans';
import { useCurrency } from '../context/CurrencyContext';
import { Search, Check, Sparkles } from 'lucide-react';

export default function Plans() {
  const { category: paramCategory } = useParams();
  const navigate = useNavigate();
  const routeCategory = paramCategory && paramCategory in CATEGORIES ? paramCategory : 'intel';

  const [activeCategory, setActiveCategory] = useState(routeCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const { formatPrice } = useCurrency();

  useEffect(() => {
    setActiveCategory(routeCategory);
  }, [routeCategory]);

  const activeGroup = CATEGORY_GROUPS.find(group => group.categories.includes(activeCategory)) || CATEGORY_GROUPS[0];
  const billingCycle = activeCategory === 'domains' ? 'year' : 'month';

  const selectCategory = (category) => {
    setActiveCategory(category);
    navigate(category === 'intel' ? '/plans' : `/plans/${category}`);
  };

  const filteredPlans = useMemo(() => {
    return ALL_PLANS.filter(plan => {
      const matchesCategory = plan.category === activeCategory;
      const searchableText = `${plan.name} ${plan.ram || ''} ${plan.cpu || ''} ${plan.storage || ''}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const row1Plans = useMemo(() => filteredPlans.slice(0, 4), [filteredPlans]);
  const row2Plans = useMemo(() => filteredPlans.slice(4, 7), [filteredPlans]);
  const remainingPlans = useMemo(() => filteredPlans.slice(7), [filteredPlans]);

  const getPlanPrice = (plan) => {
    if (plan.price === undefined || plan.price === null) {
      return { current: undefined, periodStr: plan.period || '' };
    }

    return { current: plan.price, periodStr: plan.period || 'month' };
  };

  const renderPlanCard = (plan) => {
    const isDomain = plan.category === 'domains';
    const isPopular = plan.badge === 'Popular';
    const { current: priceVal, periodStr } = getPlanPrice(plan);

    return (
      <article
        key={plan.id}
        className={`craft-card ${isPopular ? 'popular-highlight-card' : 'standard-colorful-card'}`}
      >

        {isPopular && (
          <div className="glass-arc-header">
            <svg className="arc-svg" viewBox="0 0 300 40" preserveAspectRatio="none">
              <defs>
                <filter id="whiteGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d="M 0 5 Q 150 35 300 5" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.8" />

              <circle cx="150" cy="20" r="5.5" fill="#ffffff" filter="url(#whiteGlowFilter)" />
              <circle cx="150" cy="20" r="2.5" fill="#ffffff" />
            </svg>

            <div className="live-dot-container" title="Active High-Performance Instance">
              <span className="live-pulse-dot" />
              <span className="live-text">LIVE</span>
            </div>
          </div>
        )}

        {plan.badge && (
          <div className="popular-badge-pill-fire">
            <Sparkles size={13} className="sparkle-icon" /> {plan.badge}
          </div>
        )}

        <div className="craft-card-header">
          <h3 className="craft-title">{plan.name}</h3>
          <p className="craft-subtitle">
            {isPopular ? 'Recommended high performance community node' : 'Reliable infrastructure tuned for smooth workloads'}
          </p>
        </div>

        <div className="craft-price-row">
          {priceVal !== undefined ? (
            <div className="price-container">
              <div className="price-amount-box">
                <span className={`discount-price ${isPopular ? 'popular-price-gradient' : ''}`}>
                  {formatPrice(priceVal, '')}
                </span>
                <span className="price-period-label">/{periodStr}</span>
              </div>
            </div>
          ) : (
            <span className="free-label-lg">Reward Plan</span>
          )}
        </div>

        <ul className="craft-features">
          {plan.ram && (
            <li>
              <Check size={16} className={isPopular ? 'check-orange' : 'check-cyan'} />{' '}
              <span>{plan.ram}</span>
            </li>
          )}
          {plan.cpu && (
            <li>
              <Check size={16} className={isPopular ? 'check-orange' : 'check-cyan'} />{' '}
              <span>{plan.cpu}</span>
            </li>
          )}
          {plan.storage && (
            <li>
              <Check size={16} className={isPopular ? 'check-orange' : 'check-cyan'} />{' '}
              <span>{plan.storage}</span>
            </li>
          )}
          {plan.location && (
            <li>
              <Check size={16} className={isPopular ? 'check-orange' : 'check-cyan'} />{' '}
              <span>{plan.location}</span>
            </li>
          )}
          {plan.features?.map((feat, fIdx) => (
            <li key={fIdx}>
              <Check size={16} className={isPopular ? 'check-orange' : 'check-cyan'} />{' '}
              <span>{feat}</span>
            </li>
          ))}
        </ul>

        <div className="craft-action-wrapper">
          {isDomain ? (
            <a
              className={`craft-action-btn ${isPopular ? 'popular-cta-btn' : 'standard-cta-btn'}`}
              href="https://dsc.gg/agcloud"
              target="_blank"
              rel="noopener noreferrer"
            >
              Create Discord Ticket
            </a>
          ) : (
            <Link
              className={`craft-action-btn ${isPopular ? 'popular-cta-btn' : 'standard-cta-btn'}`}
              to={`/checkout/${plan.id}`}
            >
              Subscribe for {priceVal !== undefined ? formatPrice(priceVal, periodStr) : 'Free'}
            </Link>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="section top-space">
      <div className="container">

        <div className="section-heading text-center craft-heading">
          <span className="badge-subtitle">Pro Access</span>
          <h1 className="craft-main-title">Get all AG Cloud power for your project</h1>
          <p className="craft-main-desc">High-performance game servers, VPS, and bot hosting with low Asia latency</p>

          <div className="billing-pill-container">
            <button className={`pill-option ${billingCycle === 'month' ? 'active' : ''}`} disabled={billingCycle !== 'month'}>
              Month
            </button>
            <button className="pill-option" disabled>
              Quarter
            </button>
            <button className={`pill-option ${billingCycle === 'year' ? 'active' : ''}`} disabled={billingCycle !== 'year'}>
              Year
            </button>
          </div>
        </div>

        <div className="plan-toolbar">
          <div className="category-tabs">
            {CATEGORY_GROUPS.map(group => (
              <button
                key={group.id}
                className={`tab-btn ${activeGroup.id === group.id ? 'active' : ''}`}
                onClick={() => selectCategory(group.categories[0])}
              >
                {group.label}
              </button>
            ))}
          </div>

          {activeGroup.categories.length > 1 && (
            <div className="category-tabs" aria-label={`${activeGroup.label} categories`}>
              {activeGroup.categories.map(category => (
                <button
                  key={category}
                  className={`tab-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => selectCategory(category)}
                >
                  {CATEGORIES[category]}
                </button>
              ))}
            </div>
          )}

          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search plans by RAM or CPU..."
            />
          </div>
        </div>

        {filteredPlans.length === 0 ? (
          <div className="empty-state glass-card">
            <p>No plans found matching "{searchQuery}". Try selecting another category or clear search.</p>
          </div>
        ) : (
          <div className="craft-grid-wrapper">

            {row1Plans.length > 0 && (
              <div className="craft-row-4">
                {row1Plans.map(renderPlanCard)}
              </div>
            )}

            {row2Plans.length > 0 && (
              <div className="craft-row-3">
                {row2Plans.map(renderPlanCard)}
              </div>
            )}

            {remainingPlans.length > 0 && (
              <div className="craft-row-4 mt-4">
                {remainingPlans.map(renderPlanCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
