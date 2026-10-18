import { useEffect, useMemo } from 'react';
import { Alert, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ScheduleRow from '@/components/schedules/ScheduleRow';
import { useSchedulesStore } from '@/store/schedulesStore';

const timezoneList = (): string[] => {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  const zones = intl.supportedValuesOf ? intl.supportedValuesOf('timeZone') : [];
  return zones.includes('UTC') ? zones : ['UTC', ...zones];
};

/**
 * Schedules: the jobs the code registers (apis/api-mono/api/src/jobs), each with an administrator-owned cron,
 * timezone and on/off switch. Enabling a job creates a Cloud Scheduler job in this environment; nothing polls.
 * API: GET /admin/schedules, PUT /admin/schedules/{name}, POST /admin/schedules/{name}/run.
 */
const Schedules = () => {
  const { schedules, loading, fetchSchedules, saveSchedule, runNow } = useSchedulesStore();
  const timezones = useMemo(timezoneList, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
        Schedules
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Jobs are written in the code and ship switched off. Set when each one runs and turn it on here; every
        environment keeps its own schedules. A job is one request and must finish within a few minutes.
      </Typography>

      {loading && schedules.length === 0 ? (
        <CircularProgress />
      ) : schedules.length === 0 ? (
        <Alert severity="info">No jobs are registered in the code yet. Add one under src/jobs in the API.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell>Last run</TableCell>
                <TableCell>Next run</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <ScheduleRow
                  key={schedule.name}
                  schedule={schedule}
                  timezones={timezones}
                  onSave={async (body) => {
                    await saveSchedule(schedule.name, body);
                  }}
                  onRunNow={async () => {
                    await runNow(schedule.name);
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Schedules;
