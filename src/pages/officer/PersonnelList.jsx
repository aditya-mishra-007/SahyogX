import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, X, CheckCircle2 } from 'lucide-react';
import Header from '../../components/Header/Header';
import DataTable from '../../components/DataTable/DataTable';
import SearchFilter from '../../components/SearchFilter/SearchFilter';
import Pagination from '../../components/Pagination/Pagination';
import RiskBadge from '../../components/RiskBadge/RiskBadge';
import { fetchPersonnel } from '../../api/personnelApi';
import { personnelData } from '../../mocks';
import { RISK_LEVELS, UNITS, REVIEW_STATUS } from '../../utils/constants';
import { formatDate, formatRiskScore } from '../../utils/formatters';
import { filterBySearch } from '../../utils/helpers';
import styles from '../Pages.module.css';

const reviewLabels = {
  [REVIEW_STATUS.PENDING]: 'Pending',
  [REVIEW_STATUS.IN_REVIEW]: 'In Review',
  [REVIEW_STATUS.REVIEWED]: 'Reviewed',
};

const reviewColors = {
  [REVIEW_STATUS.PENDING]: 'var(--color-risk-elevated)',
  [REVIEW_STATUS.IN_REVIEW]: 'var(--color-risk-moderate)',
  [REVIEW_STATUS.REVIEWED]: 'var(--color-risk-low)',
};

export default function PersonnelList() {
  const [personnel, setPersonnel] = useState(() => {
    try {
      const custom = JSON.parse(localStorage.getItem('sahyogx_custom_personnel') || '[]');
      return [...custom, ...personnelData];
    } catch {
      return personnelData;
    }
  });
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    id: '',
    name: '',
    rank: 'Havildar',
    unit: UNITS[0] || '14 Rajputana Rifles',
    risk_level: 'low',
    risk_score: 25,
    deployment_days: 30,
  });
  const [addSuccess, setAddSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPersonnel().then(data => {
      if (data && data.length) {
        try {
          const custom = JSON.parse(localStorage.getItem('sahyogx_custom_personnel') || '[]');
          setPersonnel([...custom, ...data]);
        } catch {
          setPersonnel(data);
        }
      }
    });
  }, []);

  const handleAddPersonnelSubmit = (e) => {
    e.preventDefault();
    if (!addForm.id.trim() || !addForm.name.trim()) return;

    const newRecord = {
      id: addForm.id.trim().toUpperCase(),
      name: addForm.name.trim(),
      rank: addForm.rank,
      unit: addForm.unit,
      service_number: addForm.id.trim().toUpperCase(),
      risk_level: addForm.risk_level,
      risk_score: Number(addForm.risk_score) || 30,
      workload_indicator: 50,
      deployment_days: Number(addForm.deployment_days) || 0,
      deployment_indicator: 'Active',
      last_assessment: 'Today',
      review_status: 'pending',
      status: 'ACTIVE',
    };

    const custom = JSON.parse(localStorage.getItem('sahyogx_custom_personnel') || '[]');
    const updatedCustom = [newRecord, ...custom];
    localStorage.setItem('sahyogx_custom_personnel', JSON.stringify(updatedCustom));

    setPersonnel(prev => [newRecord, ...prev]);
    setAddSuccess(`Soldier ${newRecord.name} (${newRecord.id}) registered successfully!`);
    setTimeout(() => {
      setAddSuccess('');
      setShowAddModal(false);
      setAddForm({
        id: '',
        name: '',
        rank: 'Havildar',
        unit: UNITS[0] || '14 Rajputana Rifles',
        risk_level: 'low',
        risk_score: 25,
        deployment_days: 30,
      });
    }, 1200);
  };

  // Apply filters
  let filtered = filterBySearch(personnel, search, ['id', 'name', 'unit', 'rank']);
  if (riskFilter) filtered = filtered.filter(p => p.risk_level === riskFilter);
  if (unitFilter) filtered = filtered.filter(p => p.unit === unitFilter);
  if (reviewFilter) filtered = filtered.filter(p => p.review_status === reviewFilter);

  // Paginate
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, riskFilter, unitFilter, reviewFilter, pageSize]);

  const columns = [
    { key: 'id', label: 'Personnel ID' },
    { key: 'name', label: 'Name' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'risk_level',
      label: 'Risk Level',
      render: (val) => <RiskBadge level={val} />,
    },
    {
      key: 'risk_score',
      label: 'Risk Score',
      render: (val) => formatRiskScore(val),
    },
    {
      key: 'workload_indicator',
      label: 'Workload',
      render: (val) => (
        <span style={{
          color: val > 70 ? 'var(--color-risk-elevated)' : val > 50 ? 'var(--color-risk-moderate)' : 'var(--color-text-primary)',
          fontWeight: 500,
        }}>
          {val}
        </span>
      ),
    },
    {
      key: 'deployment_indicator',
      label: 'Deployment',
      render: (val) => (
        <span style={{
          textTransform: 'capitalize',
          color: val === 'prolonged' ? 'var(--color-risk-elevated)' : val === 'extended' ? 'var(--color-risk-moderate)' : 'var(--color-text-primary)',
        }}>
          {val}
        </span>
      ),
    },
    {
      key: 'last_assessment',
      label: 'Last Assessment',
      render: (val) => formatDate(val),
    },
    {
      key: 'review_status',
      label: 'Review Status',
      render: (val) => (
        <span style={{ color: reviewColors[val], fontWeight: 500, fontSize: 'var(--font-size-xs)' }}>
          {reviewLabels[val] || val}
        </span>
      ),
    },
  ];

  const filters = [
    {
      key: 'risk',
      label: 'All Risk Levels',
      value: riskFilter,
      onChange: setRiskFilter,
      options: [
        { value: RISK_LEVELS.LOW, label: 'Low' },
        { value: RISK_LEVELS.MODERATE, label: 'Moderate' },
        { value: RISK_LEVELS.ELEVATED, label: 'Elevated' },
      ],
    },
    {
      key: 'unit',
      label: 'All Units',
      value: unitFilter,
      onChange: setUnitFilter,
      options: UNITS.map(u => ({ value: u, label: u })),
    },
    {
      key: 'review',
      label: 'All Review Status',
      value: reviewFilter,
      onChange: setReviewFilter,
      options: Object.entries(reviewLabels).map(([value, label]) => ({ value, label })),
    },
  ];

  return (
    <>
      <Header
        title="Personnel List"
        breadcrumbs={[
          { label: 'Dashboard', to: '/officer' },
          { label: 'Personnel List' },
        ]}
      />
      <div style={{ padding: 'var(--space-6)', maxWidth: 'var(--content-max-width)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Total Records: <strong>{personnel.length} personnel</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <UserPlus size={16} />
            <span>+ Add Personnel / Register Soldier</span>
          </button>
        </div>

        <div className={styles.filterRow}>
          <SearchFilter
            search={search}
            onSearchChange={setSearch}
            filters={filters}
          />
        </div>

        <DataTable
          columns={columns}
          data={pageData}
          onRowClick={(row) => navigate(`/officer/personnel/${row.id}`)}
          emptyMessage="No personnel match the current filters."
        />

        {showAddModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: 'var(--color-surface, #1e293b)',
              border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                    Add Personnel Data
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                    Register a new soldier into the operational welfare roster
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {addSuccess ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <CheckCircle2 size={40} color="#22c55e" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {addSuccess}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddPersonnelSubmit} style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                        Service ID *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SF-902144"
                        value={addForm.id}
                        onChange={(e) => setAddForm(prev => ({ ...prev, id: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Manoj Sharma"
                        value={addForm.name}
                        onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                        Military Rank
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Havildar"
                        value={addForm.rank}
                        onChange={(e) => setAddForm(prev => ({ ...prev, rank: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                        Assigned Unit
                      </label>
                      <select
                        value={addForm.unit}
                        onChange={(e) => setAddForm(prev => ({ ...prev, unit: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          boxSizing: 'border-box'
                        }}
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                        Assessed Risk Level
                      </label>
                      <select
                        value={addForm.risk_level}
                        onChange={(e) => setAddForm(prev => ({ ...prev, risk_level: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="low">Low Risk</option>
                        <option value="moderate">Moderate Risk</option>
                        <option value="elevated">Elevated Risk</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                        Deployment Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={addForm.deployment_days}
                        onChange={(e) => setAddForm(prev => ({ ...prev, deployment_days: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '9px 18px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--color-primary)',
                        color: '#0f172a',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Save Soldier Data
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </>
  );
}
