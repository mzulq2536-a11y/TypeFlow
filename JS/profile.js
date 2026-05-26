/* ============================================
   TYPEFLOW - Profile & Statistics Module
   ============================================ */

// ============================================
// PROFILE STATE
// ============================================
let wpmChart = null;

// ============================================
// LOAD PROFILE DATA
// ============================================
function loadProfileData() {
    // Check if user is logged in
    if (!window.AppState || !window.AppState.currentUser) {
        showProfileLoginPrompt();
        return;
    }
    
    // Load from localStorage
    const history = getTestHistory();
    const stats = calculateStats(history);
    
    // Update UI
    updateProfileUI(stats);
    updateHistoryList(history.slice(0, 10)); // Show last 10 tests
    renderWPMChart(history);
}

// ============================================
// SHOW LOGIN PROMPT
// ============================================
function showProfileLoginPrompt() {
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fas fa-user-circle" style="font-size:5rem; color:var(--text-muted); margin-bottom:20px;"></i>
                <h2>Login Required</h2>
                <p style="color:var(--text-muted); margin-bottom:24px;">
                    Please login to view your profile and track your progress.
                </p>
                <button class="btn btn-primary" onclick="document.getElementById('btnAuth').click()">
                    <i class="fas fa-sign-in-alt"></i> Login / Sign Up
                </button>
            </div>
        `;
    }
}

// ============================================
// GET TEST HISTORY
// ============================================
function getTestHistory() {
    const saved = localStorage.getItem('typeflow_history');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return [];
        }
    }
    return [];
}

// ============================================
// CALCULATE STATISTICS
// ============================================
function calculateStats(history) {
    if (history.length === 0) {
        return {
            totalTests: 0,
            avgWPM: 0,
            bestWPM: 0,
            avgAccuracy: 0,
            bestAccuracy: 0,
            totalTime: 0,
            lastTest: null,
        };
    }
    
    const totalTests = history.length;
    const totalWPM = history.reduce((sum, test) => sum + (test.wpm || 0), 0);
    const avgWPM = Math.round(totalWPM / totalTests);
    const bestWPM = Math.max(...history.map(test => test.wpm || 0));
    const totalAccuracy = history.reduce((sum, test) => sum + (test.accuracy || 0), 0);
    const avgAccuracy = Math.round(totalAccuracy / totalTests);
    const bestAccuracy = Math.max(...history.map(test => test.accuracy || 0));
    
    // Calculate total time spent (in minutes)
    const totalTime = history.reduce((sum, test) => {
        return sum + (test.duration ? test.duration / 60 : test.time ? test.time / 60 : 1);
    }, 0);
    
    return {
        totalTests,
        avgWPM,
        bestWPM,
        avgAccuracy,
        bestAccuracy,
        totalTime: Math.round(totalTime),
        lastTest: history[0],
    };
}

// ============================================
// UPDATE PROFILE UI
// ============================================
function updateProfileUI(stats) {
    const elements = {
        totalTests: document.getElementById('profileTotalTests'),
        avgWPM: document.getElementById('profileAvgWPM'),
        bestWPM: document.getElementById('profileBestWPM'),
        avgAccuracy: document.getElementById('profileAvgAccuracy'),
        profileName: document.getElementById('profileName'),
        profileEmail: document.getElementById('profileEmail'),
        profileAvatar: document.getElementById('profileAvatar'),
    };
    
    if (elements.totalTests) elements.totalTests.textContent = stats.totalTests;
    if (elements.avgWPM) elements.avgWPM.textContent = stats.avgWPM;
    if (elements.bestWPM) {
        elements.bestWPM.textContent = stats.bestWPM;
        // Add trophy color for high scores
        if (stats.bestWPM >= 80) {
            elements.bestWPM.style.color = '#f6e05e';
        } else if (stats.bestWPM >= 60) {
            elements.bestWPM.style.color = '#a0aec0';
        } else {
            elements.bestWPM.style.color = '#cd7f32';
        }
    }
    if (elements.avgAccuracy) elements.avgAccuracy.textContent = stats.avgAccuracy + '%';
    
    // Update profile header
    if (window.AppState && window.AppState.currentUser) {
        const user = window.AppState.currentUser;
        if (elements.profileName) elements.profileName.textContent = user.name || 'User';
        if (elements.profileEmail) elements.profileEmail.textContent = user.email || '';
        if (elements.profileAvatar && user.avatar) {
            elements.profileAvatar.src = user.avatar;
        }
    }
}

// ============================================
// UPDATE HISTORY LIST
// ============================================
function updateHistoryList(history) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-data">No tests completed yet. Start typing!</p>';
        return;
    }
    
    historyList.innerHTML = history.map((test, index) => {
        const date = new Date(test.date);
        const dateStr = formatDate(date);
        const typeIcon = test.type === '100-words' ? '📝' : '⌨️';
        const difficulty = test.difficulty ? ` · ${test.difficulty}` : '';
        const timeStr = test.time 
            ? `${Math.floor(test.time / 60)}:${String(test.time % 60).padStart(2, '0')}` 
            : `${test.duration || 60}s`;
        
        return `
            <div class="history-item">
                <div class="history-item-left">
                    <span class="history-icon">${typeIcon}</span>
                    <div>
                        <span class="history-wpm">${test.wpm} WPM</span>
                        <span class="history-meta">${dateStr}${difficulty} · ${timeStr}</span>
                    </div>
                </div>
                <div class="history-item-right">
                    <span class="history-accuracy ${getAccuracyClass(test.accuracy)}">
                        ${test.accuracy}%
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add styles for history items
    addHistoryStyles();
}

function getAccuracyClass(accuracy) {
    if (accuracy >= 98) return 'accuracy-perfect';
    if (accuracy >= 95) return 'accuracy-great';
    if (accuracy >= 90) return 'accuracy-good';
    return 'accuracy-needs-work';
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function addHistoryStyles() {
    if (document.getElementById('history-custom-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'history-custom-styles';
    style.textContent = `
        .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            background: var(--bg-tertiary);
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        .history-item:hover {
            transform: translateX(4px);
            box-shadow: var(--shadow);
        }
        .history-item-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .history-icon {
            font-size: 1.3rem;
        }
        .history-wpm {
            display: block;
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-primary);
        }
        .history-meta {
            display: block;
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 2px;
        }
        .history-accuracy {
            font-weight: 700;
            font-size: 1.1rem;
            padding: 6px 12px;
            border-radius: 8px;
        }
        .accuracy-perfect {
            color: #48bb78;
            background: rgba(72, 187, 120, 0.1);
        }
        .accuracy-great {
            color: #68d391;
            background: rgba(104, 211, 145, 0.1);
        }
        .accuracy-good {
            color: #f6e05e;
            background: rgba(246, 224, 94, 0.1);
        }
        .accuracy-needs-work {
            color: #fc8181;
            background: rgba(252, 129, 129, 0.1);
        }
        .no-data {
            text-align: center;
            color: var(--text-muted);
            padding: 40px 20px;
            font-size: 1rem;
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// WPM PROGRESS CHART
// ============================================
function renderWPMChart(history) {
    const canvas = document.getElementById('wpmChart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (wpmChart) {
        wpmChart.destroy();
        wpmChart = null;
    }
    
    // Prepare data for last 30 days
    const last30Days = getLast30DaysData(history);
    
    const ctx = canvas.getContext('2d');
    
    // Chart.js gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(108, 92, 231, 0.3)');
    gradient.addColorStop(1, 'rgba(108, 92, 231, 0.0)');
    
    wpmChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.labels,
            datasets: [{
                label: 'WPM',
                data: last30Days.data,
                borderColor: '#6c5ce7',
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#6c5ce7',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#a78bfa',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: 'var(--card-bg)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' WPM';
                        }
                    }
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: {
                            size: 11,
                        },
                        maxTicksLimit: 7,
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'var(--border)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: {
                            size: 11,
                        },
                        callback: function(value) {
                            return value + ' WPM';
                        },
                    },
                },
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        },
    });
}

function getLast30DaysData(history) {
    const labels = [];
    const data = [];
    const today = new Date();
    
    // Create array of last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(dateStr);
        
        // Find tests for this day
        const dayTests = history.filter(test => {
            const testDate = new Date(test.date);
            return testDate.toDateString() === date.toDateString();
        });
        
        if (dayTests.length > 0) {
            // Average WPM for the day
            const avgWPM = Math.round(
                dayTests.reduce((sum, t) => sum + t.wpm, 0) / dayTests.length
            );
            data.push(avgWPM);
        } else {
            data.push(null); // No test on this day
        }
    }
    
    return { labels, data };
}

// ============================================
// EXPORT TEST DATA
// ============================================
function exportTestData() {
    const history = getTestHistory();
    if (history.length === 0) {
        window.showToast('No data to export', 'info');
        return;
    }
    
    const csv = convertToCSV(history);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typeflow-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    window.showToast('Data exported successfully!', 'success');
}

function convertToCSV(history) {
    const headers = ['Date', 'WPM', 'Accuracy', 'Type', 'Difficulty', 'Duration', 'Characters', 'Errors'];
    const rows = history.map(test => [
        new Date(test.date).toLocaleString(),
        test.wpm,
        test.accuracy + '%',
        test.type || 'typing-test',
        test.difficulty || 'N/A',
        test.duration ? test.duration + 's' : test.time ? test.time + 's' : 'N/A',
        test.characters || 'N/A',
        test.errors || 'N/A',
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// ============================================
// CLEAR HISTORY
// ============================================
function clearHistory() {
    if (confirm('Are you sure you want to clear all your test history? This cannot be undone.')) {
        localStorage.removeItem('typeflow_history');
        loadProfileData();
        window.showToast('History cleared', 'success');
    }
}

// ============================================
// ADD EXPORT/CLEAR BUTTONS TO PROFILE
// ============================================
function addProfileActionButtons() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer || document.getElementById('profile-actions')) return;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'profile-actions';
    actionsDiv.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-bottom: 24px;
    `;
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Data';
    exportBtn.addEventListener('click', exportTestData);
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-secondary';
    clearBtn.innerHTML = '<i class="fas fa-trash"></i> Clear History';
    clearBtn.style.color = '#fc8181';
    clearBtn.addEventListener('click', clearHistory);
    
    actionsDiv.appendChild(exportBtn);
    actionsDiv.appendChild(clearBtn);
    
    chartContainer.parentNode.insertBefore(actionsDiv, chartContainer);
}

// ============================================
// INITIALIZE PROFILE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Watch for profile page navigation
    const profileNavItem = document.querySelector('[data-page="profile"]');
    if (profileNavItem) {
        const observer = new MutationObserver(() => {
            if (profileNavItem.classList.contains('active')) {
                setTimeout(() => {
                    loadProfileData();
                    addProfileActionButtons();
                }, 100);
            }
        });
        observer.observe(profileNavItem, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Initial load if profile is active
    if (document.getElementById('page-profile')?.classList.contains('active')) {
        setTimeout(() => {
            loadProfileData();
            addProfileActionButtons();
        }, 200);
    }
});

// ============================================
// EXPORT FOR APP.JS
// ============================================
window.loadProfileData = loadProfileData;
window.getTestHistory = getTestHistory;