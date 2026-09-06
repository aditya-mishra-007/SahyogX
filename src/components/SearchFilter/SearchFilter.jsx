import { Search } from 'lucide-react';
import styles from './SearchFilter.module.css';

export default function SearchFilter({ search, onSearchChange, filters = [], children }) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.searchInput}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search"
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          className={styles.filterSelect}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={filter.label}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {children}
    </div>
  );
}
