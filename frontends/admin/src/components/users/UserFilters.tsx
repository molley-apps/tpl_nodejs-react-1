import { Autocomplete, Box, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SYSTEM_ROLE_INFO, roleLabel } from '@/utils/systemAccess';

interface UserFiltersProps {
  /** Search text (debounced upstream and sent to the server) */
  search: string;
  onSearchChange: (value: string) => void;
  /** System role to filter on, null for everyone */
  roleFilter: string | null;
  onRoleChange: (value: string | null) => void;
  /** Total users matching the active filters across the whole user base (all pages) */
  matchingCount: number;
}

const roleOptions = SYSTEM_ROLE_INFO.map((info) => info.role as string);

const UserFilters = ({ search, onSearchChange, roleFilter, onRoleChange, matchingCount }: UserFiltersProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' },
          gap: 2,
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search users by email or name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Autocomplete
          options={roleOptions}
          getOptionLabel={roleLabel}
          value={roleFilter}
          onChange={(_, value) => onRoleChange(value)}
          renderInput={(params) => <TextField {...params} placeholder="Filter by system role" />}
          size="small"
          clearOnEscape
        />
      </Box>
      {(search || roleFilter) && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {matchingCount} {matchingCount === 1 ? 'user matches' : 'users match'} the active filters.
        </Typography>
      )}
    </Box>
  );
};

export default UserFilters;
