import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  FormControlLabel,
  Stack,
  Switch,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AdminSchedule } from 'apis/api-mono/services/interfaces/AdminSchedule';
import { AdminSchedulesNamePutPut } from 'apis/api-mono/services/interfaces/AdminSchedulesNamePutPut';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { describeCron } from '@/utils/describeCron';
import { relativeTime } from '@/utils/relativeTime';

interface ScheduleRowProps {
  schedule: AdminSchedule;
  timezones: string[];
  onSave: (body: AdminSchedulesNamePutPut) => Promise<void>;
  onRunNow: () => Promise<void>;
}

const statusColor = (status: string | undefined): 'success' | 'error' | 'warning' | 'default' => {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'timed-out') return 'warning';
  return 'default';
};

/**
 * One job: the code's description and default, the administrator's cron, timezone and switch, the last and next run.
 * Edits stay local until "Save schedule"; the switch saves at once because it creates or deletes a Scheduler job.
 */
const ScheduleRow = ({ schedule, timezones, onSave, onRunNow }: ScheduleRowProps) => {
  const [cron, setCron] = useState(schedule.cron ?? schedule.defaultCron);
  const [timezone, setTimezone] = useState(schedule.timezone ?? schedule.defaultTimezone);
  const [busy, setBusy] = useState<'save' | 'toggle' | 'run' | null>(null);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);

  const enabled = !!schedule.enabled;
  const dirty = cron !== (schedule.cron ?? '') || timezone !== (schedule.timezone ?? '');
  const cronWords = describeCron(cron);
  const isDefault = cron === schedule.defaultCron && timezone === schedule.defaultTimezone;

  const act = async (kind: 'save' | 'toggle' | 'run', action: () => Promise<void>) => {
    setBusy(kind);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(apiErrorMessage(err, 'The request failed'));
    } finally {
      setBusy(null);
    }
  };

  const save = (next: Partial<AdminSchedulesNamePutPut>) =>
    onSave({ cron: cron.trim(), timezone, enabled, ...next });

  return (
    <TableRow sx={{ opacity: schedule.orphaned ? 0.6 : 1, verticalAlign: 'top' }}>
      <TableCell sx={{ minWidth: 220 }}>
        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
          {schedule.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {schedule.description}
        </Typography>
        {schedule.orphaned && (
          <Chip label="No longer in the code" size="small" sx={{ mt: 1 }} />
        )}
      </TableCell>

      <TableCell sx={{ minWidth: 300 }}>
        <Stack spacing={1}>
          <TextField
            size="small"
            label="Cron"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            disabled={schedule.orphaned || busy !== null}
            error={cron.trim() !== '' && cronWords === ''}
            helperText={cronWords || (cron.trim() ? 'Not a valid five-field cron expression' : 'minute hour day month weekday')}
            inputProps={{ style: { fontFamily: 'monospace' } }}
          />
          <Autocomplete
            size="small"
            options={timezones}
            value={timezone}
            onChange={(_, value) => value && setTimezone(value)}
            disabled={schedule.orphaned || busy !== null}
            renderInput={(params) => <TextField {...params} label="Timezone" />}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" variant="contained" disabled={!dirty || cronWords === '' || busy !== null} onClick={() => act('save', () => save({}))}>
              {busy === 'save' ? 'Saving…' : 'Save schedule'}
            </Button>
            <Button
              size="small"
              disabled={isDefault || schedule.orphaned || busy !== null}
              onClick={() => {
                setCron(schedule.defaultCron);
                setTimezone(schedule.defaultTimezone);
              }}
            >
              Reset to default ({schedule.defaultCron} {schedule.defaultTimezone})
            </Button>
          </Stack>
        </Stack>
      </TableCell>

      <TableCell>
        <Tooltip title="Creates a Cloud Scheduler job in this environment while on. Nothing runs while this is off.">
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                disabled={schedule.orphaned || busy !== null || dirty}
                onChange={(e) => act('toggle', () => save({ enabled: e.target.checked }))}
              />
            }
            label={enabled ? 'Enabled' : 'Off'}
          />
        </Tooltip>
        {dirty && (
          <Typography variant="caption" color="text.secondary" display="block">
            Save the schedule first
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ minWidth: 200 }}>
        {schedule.lastRun ? (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" color={statusColor(schedule.lastRun.status)} label={schedule.lastRun.status} />
              <Typography variant="body2">{relativeTime(schedule.lastRun.finishedAt)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block">
              {schedule.lastRun.durationMs} ms, by {schedule.lastRun.by}
            </Typography>
            {schedule.lastRun.error && (
              <Typography variant="caption" color="error" display="block" sx={{ wordBreak: 'break-word' }}>
                {schedule.lastRun.error}
              </Typography>
            )}
            {schedule.lastRun.result && (
              <>
                <Button size="small" onClick={() => setShowResult((v) => !v)}>
                  {showResult ? 'Hide result' : 'Show result'}
                </Button>
                <Collapse in={showResult}>
                  <Box component="pre" sx={{ m: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(schedule.lastRun.result, null, 2)}
                  </Box>
                </Collapse>
              </>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Never run
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {enabled && schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : '—'}
        </Typography>
        {schedule.running && (
          <Chip size="small" color="info" label="Running now" sx={{ mt: 1 }} />
        )}
      </TableCell>

      <TableCell>
        <Button size="small" variant="outlined" disabled={schedule.orphaned || schedule.running || busy !== null} onClick={() => act('run', onRunNow)}>
          {busy === 'run' ? 'Running…' : 'Run now'}
        </Button>
        {error && (
          <Typography variant="caption" color="error" display="block" sx={{ mt: 1, maxWidth: 220, wordBreak: 'break-word' }}>
            {error}
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

export default ScheduleRow;
