import './index.css';
import useUserSearch from '../../../../hooks/useUserSearch';
import { UserSearchFilters } from '../../../../services/userService';

import { Filter } from 'lucide-react';

interface UserHeaderProps {
  userCount: number;
  setUserFilter: (search: string) => void;
  filters: UserSearchFilters;
  updateFilter: (key: keyof UserSearchFilters, value: string | number | undefined) => void;
  handleSearch: () => void;
  handleClearSearch: () => void;
  isSearching: boolean;
  showFilters: boolean;
  toggleFilters: () => void;
  majors: string[];
  graduationYears: number[];
  communities: { _id: string; name: string }[];
}

const UsersListHeader = ({
  userCount,
  setUserFilter,
  filters,
  updateFilter,
  handleSearch,
  handleClearSearch,
  isSearching,
  showFilters,
  toggleFilters,
  majors,
  graduationYears,
  communities,
}: UserHeaderProps) => {
  const { val, handleInputChange } = useUserSearch(setUserFilter);

  return (
    <div className='userlist_header_container right_padding'>
      <div className='bold_title'>Users List</div>

      <div className='search-and-filters-row'>
        <div className='user-search-wrapper'>
          <svg
            className='user-search-icon'
            width='18'
            height='18'
            viewBox='0 0 26 25'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M23.5167 24.75L14.5917 16.0875C13.8833 16.6375 13.0687 17.0729 12.1479 17.3938C11.2271 17.7146 10.2472 17.875 9.20833 17.875C6.63472 17.875 4.4566 17.0099 2.67396 15.2797C0.891319 13.5495 0 11.4354 0 8.9375C0 6.43958 0.891319 4.32552 2.67396 2.59531C4.4566 0.865104 6.63472 0 9.20833 0C11.7819 0 13.9601 0.865104 15.7427 2.59531C17.5253 4.32552 18.4167 6.43958 18.4167 8.9375C18.4167 9.94583 18.2514 10.8969 17.9208 11.7906C17.5903 12.6844 17.1417 13.475 16.575 14.1625L25.5 22.825L23.5167 24.75ZM9.20833 15.125C10.9792 15.125 12.4844 14.5234 13.724 13.3203C14.9635 12.1172 15.5833 10.6562 15.5833 8.9375C15.5833 7.21875 14.9635 5.75781 13.724 4.55469C12.4844 3.35156 10.9792 2.75 9.20833 2.75C7.4375 2.75 5.93229 3.35156 4.69271 4.55469C3.45312 5.75781 2.83333 7.21875 2.83333 8.9375C2.83333 10.6562 3.45312 12.1172 4.69271 13.3203C5.93229 14.5234 7.4375 15.125 9.20833 15.125Z'
              fill='#9CA3AF'
            />
          </svg>
          <input
            id='user_search_bar'
            placeholder='Search Users ...'
            type='text'
            value={val}
            onChange={handleInputChange}
          />
        </div>

        <div className='filter-controls-row'>
          <button className='filter-control-btn' onClick={toggleFilters}>
            <Filter size={16} />
          </button>
          <button
            className='filter-control-btn search-btn'
            onClick={handleSearch}
            disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button className='filter-control-btn clear-btn' onClick={handleClearSearch}>
            Clear
          </button>
        </div>
      </div>

      {showFilters && (
        <div className='filters-panel-header'>
          <div className='filter-row'>
            <div className='filter-column'>
              <label>Major:</label>
              <select
                value={filters.major || ''}
                onChange={e => updateFilter('major', e.target.value)}>
                <option value=''>All Majors</option>
                {majors.map(major => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            </div>

            <div className='filter-column'>
              <label>Graduation Year:</label>
              <select
                value={filters.graduationYear || ''}
                onChange={e =>
                  updateFilter(
                    'graduationYear',
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }>
                <option value=''>All Years</option>
                {graduationYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className='filter-column'>
              <label>Community:</label>
              <select
                value={filters.communityId || ''}
                onChange={e => updateFilter('communityId', e.target.value)}>
                <option value=''>All Communities</option>
                {communities.map(community => (
                  <option key={community._id} value={community._id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='filter-row'>
            <div className='filter-column'>
              <label>Career Goals:</label>
              <input
                type='text'
                value={filters.careerGoals || ''}
                onChange={e => updateFilter('careerGoals', e.target.value)}
              />
              <small style={{ color: '#888', fontSize: '0.85em' }}>
                Comma-separated (e.g., "data science, finance")
              </small>
            </div>

            <div className='filter-column'>
              <label>Technical Interests:</label>
              <input
                type='text'
                value={filters.technicalInterests || ''}
                onChange={e => updateFilter('technicalInterests', e.target.value)}
              />
              <small style={{ color: '#888', fontSize: '0.85em' }}>
                Comma-separated (e.g., "machine learning, react")
              </small>
            </div>
          </div>
        </div>
      )}

      <div className='user_count_label'>
        <span id='user_count'>{userCount} </span>
        <span className='user_count_text'>users</span>
      </div>
    </div>
  );
};

export default UsersListHeader;
