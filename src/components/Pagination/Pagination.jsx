import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZES } from '../../utils/constants';
import styles from './Pagination.module.css';

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>
        Showing {start}–{end} of {totalItems}
      </span>
      <div className={styles.pageControls}>
        <button
          className={styles.pageBtn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {getPageNumbers().map((p) => (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
        {onPageSizeChange && (
          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Page size"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}/page
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
