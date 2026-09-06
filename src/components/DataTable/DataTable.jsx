import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';
import styles from './DataTable.module.css';

export default function DataTable({
  title,
  columns,
  data,
  onRowClick,
  headerActions,
  emptyMessage = 'No data available',
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (typeof valA === 'string') {
          const cmp = valA.localeCompare(valB);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        return sortDir === 'asc' ? valA - valB : valB - valA;
      })
    : data;

  return (
    <div className={styles.tableWrap}>
      {(title || headerActions) && (
        <div className={styles.tableHeader}>
          {title && <h3 className={styles.tableTitle}>{title}</h3>}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable === false ? 'default' : 'pointer' }}
                >
                  {col.label}
                  {col.sortable !== false && (
                    <span
                      className={`${styles.sortIcon} ${
                        sortKey === col.key ? styles.sortActive : ''
                      }`}
                    >
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? '▲' : '▼'
                      ) : (
                        '⇅'
                      )}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className={styles.emptyState}>
                    <Inbox size={40} />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={onRowClick ? styles.clickableRow : ''}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
