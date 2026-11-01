
import { useState } from 'react';
import {
  Activity, ShieldCheck, LayoutDashboard, GitPullRequest,
  FileText, Settings, Bell, Plus, ArrowUpRight,
  AlertTriangle, Bug, Clock, GitBranch, ChevronRight,
  Code2, Zap, CircleCheck, Loader2
} from 'lucide-react';
import './App.css';

type Page = 'Dashboard' | 'New Review' | 'Reports' | 'Settings';

type Finding = {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  file: string;
  description: string;
  suggestion: string;
  line?: number;
  confidence?: number;
  validation_status?: string;
  evidence?: string;
};

type ReviewData = {
  pull_request: {
    number: number;
    title: string;
    url: string;
  };
  total_files_reviewed: number;
  review: {
    summary: string;
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    findings: Finding[];
  };
  report: string;
  report_path: string;
};

function App() {
  const [page, setPage] = useState<Page>('Dashboard');
  const [owner, setOwner] = useState('nodejs');
  const [repo, setRepo] = useState('node');
  const [pr, setPr] = useState('67122');
  const [loading, setLoading] = useState(false);

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReviewData | null>(null);
  const [error, setError] = useState('');

  const startReview = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: owner.trim(),
          repo: repo.trim(),
          pull_number: Number(pr),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Review failed: ${response.status}`);
      }

      const newReview = data as ReviewData;

      setReviews(previous => [newReview, ...previous]);
      setSelectedReport(newReview);
      setPage('Reports');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    { name: 'Dashboard' as Page, icon: LayoutDashboard },
    { name: 'New Review' as Page, icon: GitPullRequest },
    { name: 'Reports' as Page, icon: FileText },
    { name: 'Settings' as Page, icon: Settings }
  ];

  const riskClass = (risk: string) =>
    ['low', 'medium', 'high', 'critical'].includes(risk)
      ? risk
      : 'medium';

  const totalFindings = reviews.reduce(
    (total, item) => total + item.review.findings.length, 0
  );

  const totalFiles = reviews.reduce(
    (total, item) => total + item.total_files_reviewed, 0
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={23}/></div>
          <div>
            <h2>PR Guardian</h2>
            <span>AI CODE INTELLIGENCE</span>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">G</div>
          <div><strong>My Workspace</strong><small>Personal workspace</small></div>
          <ChevronRight size={15}/>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                className={`nav-item ${page === item.name ? 'active' : ''}`}
                onClick={() => setPage(item.name)}
              >
                <Icon size={18}/>
                <span>{item.name}</span>
                {item.name === 'New Review' && <Plus size={15} className="nav-plus"/>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="connection"><span className="online-dot"/> AI Engine ready</div>
          <div className="user-profile">
            <div className="user-avatar">G</div>
            <div><strong>Developer</strong><small>Free workspace</small></div>
            <Settings size={17}/>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{page}</strong></div>
          <div className="top-actions">
            <span className="system-status"><span className="online-dot"/> System operational</span>
            <button className="icon-button"><Bell size={18}/></button>
            <div className="top-avatar">G</div>
          </div>
        </header>

        <div className="page-content">

          {page === 'Dashboard' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h1>Code review, <span>reimagined.</span></h1>
                  <p className="subheading">Your AI-powered command center for safer code.</p>
                </div>
                <button className="primary-button" onClick={() => setPage('New Review')}>
                  <Plus size={17}/> New review
                </button>
              </div>

              <div className="welcome-banner">
                <div className="banner-content">
                  <div className="banner-tag"><Zap size={13}/> AI-POWERED CODE INTELLIGENCE</div>
                  <h2>Ship better code.<br/><span>Catch issues before they ship.</span></h2>
                  <p>Analyze pull requests for bugs, security vulnerabilities and risky changes with AI.</p>
                  <button className="banner-button" onClick={() => setPage('New Review')}>
                    Review a pull request <ArrowUpRight size={16}/>
                  </button>
                </div>
                <div className="banner-art">
                  <div className="orbit orbit-one"/>
                  <div className="orbit orbit-two"/>
                  <div className="shield-art"><ShieldCheck size={72}/></div>
                  <div className="floating-chip chip-one"><Bug size={15}/> Bug detection</div>
                  <div className="floating-chip chip-two"><ShieldCheck size={15}/> Security scan</div>
                  <div className="floating-chip chip-three"><Code2 size={15}/> Code analysis</div>
                </div>
              </div>

              <div className="section-heading">
                <div><h3>Workspace overview</h3><p>Your review activity at a glance</p></div>
                <span className="period-label">ALL TIME</span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top"><span>Total reviews</span><div className="stat-icon purple"><GitPullRequest size={18}/></div></div>
                  <h2>{reviews.length}</h2><small>Completed reviews this session</small>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>Issues detected</span><div className="stat-icon orange"><AlertTriangle size={18}/></div></div>
                  <h2>{totalFindings}</h2><small>Actual AI findings</small>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>Files analyzed</span><div className="stat-icon blue"><Code2 size={18}/></div></div>
                  <h2>{totalFiles}</h2><small>Across your reviews</small>
                </div>
                <div className="stat-card">
                  <div className="stat-top"><span>AI engine</span><div className="stat-icon green"><Activity size={18}/></div></div>
                  <h2 className="engine-value">Active</h2><small><span className="online-dot"/> Backend connected</small>
                </div>
              </div>

              <div className="section-heading recent-heading">
                <div><h3>Recent activity</h3><p>Your latest pull request reviews</p></div>
                <button className="text-button" onClick={() => setPage('Reports')}>View reports <ArrowUpRight size={15}/></button>
              </div>

              {reviews.length === 0 ? (
                <p className="demo-note">No reviews yet. Start your first review to see activity here.</p>
              ) : (
                reviews.slice(0, 5).map((item, index) => (
                  <div className="activity-card" key={`${item.pull_request.url}-${index}`}>
                    <div className="repo-icon"><GitBranch size={21}/></div>
                    <div className="activity-info">
                      <strong>{owner} / {repo}</strong>
                      <span>PR #{item.pull_request.number} · {item.pull_request.title}</span>
                    </div>
                    <span className={`risk-pill ${riskClass(item.review.overall_risk)}`}>
                      {item.review.overall_risk} risk
                    </span>
                    <span className="activity-time"><Clock size={14}/> Completed</span>
                    <button className="icon-button" onClick={() => {
                      setSelectedReport(item);
                      setPage('Reports');
                    }}><ArrowUpRight size={17}/></button>
                  </div>
                ))
              )}
            </>
          )}

          {page === 'New Review' && (
            <>
              <div className="page-heading">
                <div><p className="eyebrow">ANALYSIS</p><h1>New <span>review.</span></h1><p className="subheading">Give PR Guardian a GitHub pull request to analyze.</p></div>
              </div>

              <div className="form-layout">
                <div className="review-form-card">
                  <div className="form-title"><GitBranch size={22}/><div><h3>GitHub pull request</h3><p>Enter the repository details below.</p></div></div>

                  <label>Repository owner</label>
                  <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. facebook"/>

                  <label>Repository name</label>
                  <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="e.g. react"/>

                  <label>Pull request number</label>
                  <input type="number" min="1" value={pr} onChange={e => setPr(e.target.value)} placeholder="e.g. 123"/>

                  <button className="primary-button full-button" onClick={startReview} disabled={loading || !owner.trim() || !repo.trim() || !pr || Number(pr) < 1}>
                    {loading ? <><Loader2 className="spin" size={17}/> Reviewing PR...</> : <><Zap size={17}/> Start AI review</>}
                  </button>

                  {error && <p style={{ color: '#ff6b6b', marginTop: 12 }}>{error}</p>}

                  <p className="form-footnote"><ShieldCheck size={14}/> Your code is analyzed, not modified.</p>
                </div>

                <div className="analysis-card">
                  <div className="analysis-icon"><ShieldCheck size={30}/></div>
                  <h3>What we analyze</h3>
                  <div className="analysis-item"><Bug size={17}/><div><strong>Bug detection</strong><span>Logical errors and regressions</span></div></div>
                  <div className="analysis-item"><ShieldCheck size={17}/><div><strong>Security analysis</strong><span>Potential vulnerabilities</span></div></div>
                  <div className="analysis-item"><Activity size={17}/><div><strong>Code quality</strong><span>Performance and maintainability</span></div></div>
                  <div className="analysis-item"><CircleCheck size={17}/><div><strong>Evidence validation</strong><span>Check findings against changed code</span></div></div>
                </div>
              </div>
            </>
          )}

          {page === 'Reports' && (
            <>
              <div className="page-heading">
                <div><p className="eyebrow">REVIEW HISTORY</p><h1>Your <span>reports.</span></h1><p className="subheading">Actual review results returned by your backend.</p></div>
                <button className="primary-button" onClick={() => setPage('New Review')}><Plus size={17}/> New review</button>
              </div>

              {reviews.length === 0 ? (
                <p className="demo-note">No reports yet. Submit a pull request for review first.</p>
              ) : (
                reviews.map((item, index) => (
                  <div className="report-card" key={`${item.pull_request.url}-${index}`}>
                    <div className="repo-icon"><GitBranch size={22}/></div>
                    <div className="report-info">
                      <strong>{owner} / {repo}</strong>
                      <span>PR #{item.pull_request.number} · {item.pull_request.title}</span>
                      <small>{item.total_files_reviewed} files analyzed · {item.review.findings.length} findings</small>
                    </div>
                    <span className={`risk-pill ${riskClass(item.review.overall_risk)}`}>
                      {item.review.overall_risk} risk
                    </span>
                    <button className="secondary-button" onClick={() => setSelectedReport(selectedReport === item ? null : item)}>
                      {selectedReport === item ? 'Hide report' : 'View report'} <ArrowUpRight size={15}/>
                    </button>
                  </div>
                ))
              )}

              {selectedReport && (
                <div className="settings-card" style={{ marginTop: 24 }}>
                  <h3>
                    {selectedReport.pull_request.title}
                  </h3>
                  <p>
                    PR #{selectedReport.pull_request.number} · {selectedReport.total_files_reviewed} files analyzed
                  </p>
                  <p style={{ marginTop: 12 }}>{selectedReport.review.summary}</p>

                  <a href={selectedReport.pull_request.url} target="_blank" rel="noreferrer">
                    Open pull request on GitHub ↗
                  </a>

                  <h3 style={{ marginTop: 24 }}>Findings ({selectedReport.review.findings.length})</h3>

                  {selectedReport.review.findings.length === 0 ? (
                    <p>No findings returned by the AI review.</p>
                  ) : (
                    selectedReport.review.findings.map((finding, index) => (
                      <div key={index} style={{ padding: '16px 0', borderBottom: '1px solid #333' }}>
                        <strong>{finding.severity.toUpperCase()} · {finding.category}</strong>
                        <p>{finding.file}{finding.line ? ` · Line ${finding.line}` : ''}</p>
                        <p>{finding.description}</p>
                        <p><strong>Suggestion:</strong> {finding.suggestion}</p>
                        {finding.evidence && <p><strong>Evidence:</strong> {finding.evidence}</p>}
                        {finding.validation_status && <small>Validation: {finding.validation_status}</small>}
                      </div>
                    ))
                  )}

                  <h3 style={{ marginTop: 24 }}>Generated Markdown report</h3>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    background: '#111',
                    padding: 16,
                    borderRadius: 8,
                    maxHeight: 500,
                    overflowY: 'auto'
                  }}>
                    {selectedReport.report}
                  </pre>

                  <p className="demo-note">Saved at: {selectedReport.report_path}</p>
                </div>
              )}
            </>
          )}

          {page === 'Settings' && (
            <>
              <div className="page-heading"><div><p className="eyebrow">PREFERENCES</p><h1>Workspace <span>settings.</span></h1><p className="subheading">Your PR Guardian configuration.</p></div></div>
              <div className="settings-card">
                <h3>AI provider</h3>
                <p>Your configured AI review provider is managed by the backend environment.</p>
                <div className="setting-row"><div className="setting-logo">AI</div><div><strong>Backend AI provider</strong><small>Configured through environment variables</small></div><span className="connected-pill">Configured</span></div>
                <div className="setting-row"><GitBranch size={24}/><div><strong>GitHub API</strong><small>Pull request and diff access</small></div><span className="connected-pill">Configured</span></div>
                <p className="demo-note">API keys are managed securely in your backend environment file, not in this frontend.</p>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
