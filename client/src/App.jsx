import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Map, Activity, Users, AlertCircle, CheckCircle2, Navigation, Sparkles, UserPlus, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

const COLORS = ['#1b4332', '#2d6a4f', '#dda15e', '#bc6c25', '#e76f51'];
const CITIES = {
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Bangalore: { lat: 12.9716, lng: 77.5946 }
};

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [currentCity, setCurrentCity] = useState('Delhi');
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [rankedVolunteers, setRankedVolunteers] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map) {
      map.setView([CITIES[currentCity].lat, CITIES[currentCity].lng], 12);
    }
  }, [currentCity, map]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [needsRes, volsRes] = await Promise.all([
        axios.get(`${API_BASE}/needs`),
        axios.get(`${API_BASE}/volunteers`)
      ]);
      setNeeds(needsRes.data);
      setVolunteers(volsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleSelectNeed = async (need) => {
    setSelectedNeed(need);
    if (need.status === 'assigned') return;
    
    setIsMatching(true);
    try {
      const res = await axios.get(`${API_BASE}/match/${need.id}`);
      setRankedVolunteers(res.data);
    } catch (err) {
      console.error('Matching error:', err);
    } finally {
      setIsMatching(false);
    }
  };

  const handleAllocate = async (volunteerId, reasoning, score) => {
    try {
      await axios.post(`${API_BASE}/allocate`, {
        need_id: selectedNeed.id,
        volunteer_id: volunteerId,
        ai_reasoning: reasoning,
        match_score: score
      });
      setSelectedNeed(null);
      setRankedVolunteers([]);
      fetchData();
    } catch (err) {
      alert('Allocation failed');
    }
  };

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo">SmartAlloc.</div>
        <nav className="nav-links">
          <NavItem active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<Map size={18}/>} label="Live Map" />
          <NavItem active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Activity size={18}/>} label="Data Aggregation" />
          <NavItem active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={<AlertTriangle size={18}/>} label="Report Need" />
          <NavItem active={activeTab === 'volunteers'} onClick={() => setActiveTab('volunteers')} icon={<Users size={18}/>} label="Volunteer Force" />
          <NavItem active={activeTab === 'register'} onClick={() => setActiveTab('register')} icon={<UserPlus size={18}/>} label="Join as Volunteer" />
        </nav>
      </aside>

      <main className="main-area">
        <header className="page-header">
          <div>
            <h1 style={{ margin: 0 }}>Intelligent Resource Coordination</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Dynamic allocation driven by parameters and AI.</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <select 
              className="form-input" 
              style={{ width: '150px', margin: 0 }} 
              value={currentCity} 
              onChange={(e) => setCurrentCity(e.target.value)}
            >
              {Object.keys(CITIES).map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 600 }}>
              <span style={{ color: '#b91c1c' }}>{needs.filter(n=>n.urgency==='Critical' && n.status==='pending').length} Critical Alerts</span>
              <span style={{ color: 'var(--brand-deep)' }}>{volunteers.length} Active Personnel</span>
            </div>
          </div>
        </header>

        {activeTab === 'map' && (
          <div className="dashboard-layout">
            <div className="map-container">
              <MapContainer center={[CITIES[currentCity].lat, CITIES[currentCity].lng]} zoom={12} scrollWheelZoom={true} zoomControl={false} whenCreated={setMap}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {needs.map(need => (
                  <CircleMarker
                    key={need.id}
                    center={[need.lat, need.lng]}
                    radius={need.urgency === 'Critical' ? 12 : need.urgency === 'High' ? 10 : 8}
                    pathOptions={{ 
                      fillColor: need.status === 'assigned' ? 'var(--brand-mid)' : need.urgency === 'Critical' ? '#ef4444' : need.urgency === 'High' ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      weight: 2,
                      fillOpacity: 0.8
                    }}
                    eventHandlers={{ click: () => handleSelectNeed(need) }}
                  >
                    <Popup>
                      <strong>{need.title}</strong><br/>
                      {need.status === 'assigned' ? 'Allocated ✓' : 'Pending Allocation'}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
              {/* Floating Legend */}
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
                <h4 style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Map Legend</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444'}}></span> Critical Needs</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}><span style={{ width:10, height:10, borderRadius:'50%', background:'var(--brand-mid)'}}></span> Allocated Tasks</div>
              </div>
            </div>
            
            {/* Dynamic Dispatch Panel */}
            <div className="side-panel">
              {!selectedNeed ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <Navigation size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                  <h3>Dynamic Dispatch Center</h3>
                  <p>Select a hotspot on the map to run smart allocation analysis.</p>
                </div>
              ) : (
                <div className="animate-slide">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={`urgency-badge urgency-${selectedNeed.urgency}`}>{selectedNeed.urgency} Priority</span>
                    <button onClick={() => setSelectedNeed(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.2rem' }}>{selectedNeed.title}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{selectedNeed.description}</p>
                  
                  {selectedNeed.status === 'assigned' ? (
                    <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <CheckCircle2 color="#059669" style={{ marginBottom: '0.5rem' }} />
                      <h4 style={{ color: '#065f46' }}>Resource Allocated</h4>
                      <p style={{ fontSize: '0.85rem', color: '#064e3b' }}>A volunteer has been dispatched to this location.</p>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <Sparkles size={18} color="var(--accent-warm)" /> Smart Matches
                      </h3>
                      {isMatching ? (
                        <p style={{ color: 'var(--brand-mid)' }}>Analyzing spatial and skill parameters...</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                          {rankedVolunteers.slice(0,3).map((vol, idx) => (
                            <div key={vol.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{vol.name}</strong>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-deep)' }}>Match: {vol.match_score}%</span>
                              </div>
                              <div className="score-bar"><div className="score-fill" style={{ width: `${vol.match_score}%` }}></div></div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.75rem 0' }}>{vol.ai_reasoning}</p>
                              <div style={{ fontSize: '0.75rem', color: 'var(--brand-mid)', marginBottom: '1rem' }}>{vol.skills}</div>
                              <button className="btn-action btn-primary" style={{ width: '100%', padding: '0.5rem' }} onClick={() => handleAllocate(vol.id, vol.ai_reasoning, vol.match_score)}>
                                Dispatch Volunteer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <DataAggregationView needs={needs} />
        )}

        {activeTab === 'volunteers' && (
          <div style={{ padding: '2rem', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Registered Volunteer Force</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {volunteers.map(v => (
                <div key={v.id} className="impact-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{v.name}</h3>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-creamy)', padding: '4px 8px', borderRadius: '4px' }}>{v.availability}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{v.location}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {v.skills.split(',').map((s,i) => <span key={i} style={{ fontSize:'0.75rem', background:'var(--brand-light)', padding:'2px 8px', borderRadius:'12px', color:'var(--brand-deep)'}}>{s.trim()}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Become a Volunteer</h2>
            <div className="impact-card" style={{ padding: '2.5rem', cursor: 'default' }}>
              <VolunteerForm onComplete={() => { setActiveTab('volunteers'); fetchData(); }} defaultCoords={CITIES[currentCity]} />
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Report Community Need</h2>
            <div className="impact-card" style={{ padding: '2.5rem', cursor: 'default' }}>
              <ReportNeedForm onComplete={() => { setActiveTab('map'); fetchData(); }} defaultCoords={CITIES[currentCity]} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ReportNeedForm({ onComplete, defaultCoords }) {
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', lat: defaultCoords.lat, lng: defaultCoords.lng, urgency: 'High', category: 'Health'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Add a tiny random offset to lat/lng so markers don't stack perfectly on top of each other
      const reportData = {
        ...formData,
        lat: formData.lat + (Math.random() - 0.5) * 0.02,
        lng: formData.lng + (Math.random() - 0.5) * 0.02
      };
      await axios.post(`${API_BASE}/needs`, reportData);
      alert('Need reported successfully!');
      onComplete();
    } catch (err) {
      alert('Failed to report need. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Issue Title</label>
        <input required type="text" className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Flooded Roads in Area 4" />
      </div>

      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
        <textarea required className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the situation and specific needs..." />
      </div>

      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Location Area</label>
        <input required type="text" className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. South Delhi" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Urgency Level</label>
          <select className="form-input" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
          <select className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>Health</option>
            <option>Food</option>
            <option>Water</option>
            <option>Infrastructure</option>
            <option>Education</option>
            <option>Agriculture</option>
            <option>Logistics</option>
          </select>
        </div>
      </div>

      <button disabled={loading} type="submit" className="btn-action btn-primary" style={{ marginTop: '1rem', width: '200px' }}>
        {loading ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}

function VolunteerForm({ onComplete, defaultCoords }) {
  const [formData, setFormData] = useState({
    name: '', skills: '', location: '', lat: defaultCoords.lat, lng: defaultCoords.lng, availability: 'Full-time', contact: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/volunteers`, formData);
      alert('Registration successful! Welcome to the team.');
      onComplete();
    } catch (err) {
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Full Name</label>
          <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Location Name</label>
          <input required type="text" className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. New Delhi" />
        </div>
      </div>
      
      <div className="form-group">
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Skills (Comma separated)</label>
        <input required type="text" className="form-input" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="e.g. Medical, Triage, Logistics" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Availability</label>
          <select className="form-input" value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})}>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Weekends</option>
            <option>Evenings</option>
            <option>On-call</option>
          </select>
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Contact Info</label>
          <input required type="text" className="form-input" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="Email or Phone" />
        </div>
      </div>

      <button disabled={loading} type="submit" className="btn-action btn-primary" style={{ marginTop: '1rem', width: '200px' }}>
        {loading ? 'Registering...' : 'Submit Registration'}
      </button>
    </form>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <div onClick={onClick} className={`nav-item ${active ? 'active' : ''}`}>
      {icon} {label}
    </div>
  );
}

function DataAggregationView({ needs }) {
  // Aggregate data by category
  const categoryCount = needs.reduce((acc, need) => {
    acc[need.category] = (acc[need.category] || 0) + 1;
    return acc;
  }, {});
  
  const barData = Object.keys(categoryCount).map(k => ({ name: k, count: categoryCount[k] }));

  // Aggregate by urgency
  const urgencyCount = needs.reduce((acc, need) => {
    acc[need.urgency] = (acc[need.urgency] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(urgencyCount).map(k => ({ name: k, value: urgencyCount[k] }));

  return (
    <div className="charts-grid animate-slide">
      <div className="chart-box" style={{ gridColumn: '1 / -1' }}>
        <h3>Overview Metrics</h3>
        <div style={{ display: 'flex', gap: '3rem', marginTop: '1rem' }}>
          <div>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'Libre Baskerville', color: 'var(--brand-deep)' }}>{needs.length}</span>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Total Reports</p>
          </div>
          <div>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'Libre Baskerville', color: 'var(--brand-mid)' }}>{needs.filter(n=>n.status==='assigned').length}</span>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Successful Allocations</p>
          </div>
          <div>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'Libre Baskerville', color: '#b91c1c' }}>{needs.filter(n=>n.urgency==='Critical' && n.status==='pending').length}</span>
            <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Critical Action Needed</p>
          </div>
        </div>
      </div>

      <div className="chart-box">
        <h3>Needs by Category</h3>
        <div style={{ height: 300, marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis />
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
              <Bar dataKey="count" fill="var(--brand-mid)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-box">
        <h3>Urgency Distribution</h3>
        <div style={{ height: 300, marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.name === 'Critical' ? '#ef4444' : 
                    entry.name === 'High' ? '#f59e0b' : 
                    entry.name === 'Medium' ? '#3b82f6' : '#10b981'
                  } />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
