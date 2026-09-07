import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import DataTable from '../../components/DataTable/DataTable';
import SearchFilter from '../../components/SearchFilter/SearchFilter';
import Pagination from '../../components/Pagination/Pagination';
import RiskBadge from '../../components/RiskBadge/RiskBadge';
import { fetchPersonnel } from '../../api/personnelApi';
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
  const [personnel, setPersonnel] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPersonnel().then(setPersonnel);
  }, []);

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
