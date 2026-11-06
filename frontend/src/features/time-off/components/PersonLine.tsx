import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { InitialsAvatar } from '@/shared/components/InitialsAvatar';
import { fullName } from '../format';
import type { TimeOffPerson } from '../types';

/** Avatar, name and position (admins: "Administrator"). */
export function PersonLine({ person }: { person: TimeOffPerson }) {
  const { t } = useTranslation('timeOff');
  return (
    <span className="flex min-w-0 items-center gap-3">
      <InitialsAvatar id={person.id} firstName={person.firstName} lastName={person.lastName} />
      <span className="flex min-w-0 flex-col">
        <Typography variant="subtitle2" component="span" className="truncate">
          {fullName(person)}
        </Typography>
        <Typography variant="caption" component="span" color="textSecondary" className="truncate">
          {person.positionTitle ?? t('details.admin')}
        </Typography>
      </span>
    </span>
  );
}
