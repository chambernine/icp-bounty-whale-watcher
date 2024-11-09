import React, { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { whale_watcher_backend } from 'declarations/whale-watcher-backend';
import { CreditCard, ArrowRight } from 'lucide-react';

const WhaleWatcher = () => {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [stats, setStats] = useState({
    totalWhales: 0,
    totalVolume: 0,
    largestTransfer: 0
  });

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransfers();
      fetchStats();
    }
  }, [isAuthenticated]);

  async function initAuth() {
    const client = await AuthClient.create();
    setAuthClient(client);

    const isAuthenticated = await client.isAuthenticated();
    setIsAuthenticated(isAuthenticated);

    if (isAuthenticated) {
      const identity = client.getIdentity();
      const principal = identity.getPrincipal().toString();
      setPrincipal(principal);
    }
  }

  async function login() {
    const daysToAdd = BigInt(1);
    const EIGHT_HOURS_IN_NANOSECONDS = BigInt(8 * 60 * 60 * 1000000000);
    
    await authClient?.login({
      identityProvider: process.env.II_URL || "https://identity.ic0.app",
      maxTimeToLive: daysToAdd * EIGHT_HOURS_IN_NANOSECONDS,
      onSuccess: async () => {
        setIsAuthenticated(true);
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal().toString();
        setPrincipal(principal);
      },
    });
  }

  async function logout() {
    await authClient?.logout();
    setIsAuthenticated(false);
    setPrincipal(null);
  }

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const result = await whale_watcher_backend.getWhaleTransfers();
      setTransfers(result);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
    setIsLoading(false);
  };

  const fetchStats = async () => {
    try {
      const stats = await whale_watcher_backend.getStats();
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="app-container">
    <div className={isAuthenticated ? "container-grid" : "container" }>
      <div className="header">
        <h1>Whale Watcher</h1>
        <p>Track USDC transfers over $1 million</p>
      </div>

      <div className={isAuthenticated ? "sidebar" : "card" }>
        <div className="auth-section">
          {isAuthenticated ? (
            <div className="auth-info">
              <p className="principal-text">Principal ID: {principal?.slice(0, 8)}...</p>
              <button onClick={logout} className="auth-button logout">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={login} className="auth-button login">
              Login with Internet Identity
            </button>
          )}
        </div>

        {isAuthenticated && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <h3>Total Whales</h3>
                <p>{stats.totalWhales}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3>Total Volume</h3>
                <p>{formatAmount(stats.totalVolume)}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <h3>Largest Transfer</h3>
                <p>{formatAmount(stats.largestTransfer)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="transfers-container">
          <h2>Recent Whale Transfers</h2>
          {isLoading ? (
            <div className="loading">Loading transfers...</div>
          ) : (
            <div className="transfers-list">
              {transfers.map((transfer, index) => (
                <div key={index} className="transfer-card">
                  <div className="transfer-header">
                    <span className="transfer-date">
                      {formatDate(transfer.timestamp)}
                    </span>
                    <span className="transfer-amount">
                      {formatAmount(transfer.amount)}
                    </span>
                  </div>
                  <div className="transfer-details">
                    <div className="address-group">
                      <span className="label">From</span>
                      <span className="address">
                        {formatAddress(transfer.from)}
                      </span>
                    </div>
                    <ArrowRight className="transfer-arrow" />
                    <div className="address-group">
                      <span className="label">To</span>
                      <span className="address">
                        {formatAddress(transfer.to)}
                      </span>
                    </div>
                  </div>
                  {transfer.nftMinted && (
                    <div className="nft-badge">
                      NFT Minted
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    <div className="footer">
      <img src="/logo2.svg" alt="DFINITY logo" className="footer-logo" />
    </div>
  </main>
);
};

export default WhaleWatcher;