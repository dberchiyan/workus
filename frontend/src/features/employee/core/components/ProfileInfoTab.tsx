import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import ContactPhoneOutlined from '@mui/icons-material/ContactPhoneOutlined';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';
import { addMonthsIso, formatCalendarDate, todayIso, yearsAndMonthsBetween } from '../format';
import type { EmployeeProfileMock } from '../mocks/employeeProfileMock';
import type { EmployeeProfile } from '../types';
import { DetailSection } from './DetailSection';

/** Holidays can be taken six months after the start date. */
const HOLIDAY_ELIGIBILITY_MONTHS = 6;

export interface ProfileInfoTabProps {
  employee: EmployeeProfile;
  mock: EmployeeProfileMock;
}

export function ProfileInfoTab({ employee, mock }: ProfileInfoTabProps) {
  const { t, i18n } = useTranslation('employee');
  const date = (iso: string) => formatCalendarDate(iso, i18n.language);
  const external = (href: string, text: string) => (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {text}
      <span className="sr-only"> {t('profile.values.opensInNewTab')}</span>
    </Link>
  );
  const tenureUntil = employee.terminatedOn ?? todayIso();
  const tenure = yearsAndMonthsBetween(employee.startDate, tenureUntil);
  const age = yearsAndMonthsBetween(mock.dateOfBirth, todayIso()).years;
  const { contacts } = employee;

  return (
    <div className="flex flex-col gap-2 pb-4">
      <DetailSection
        title={t('profile.sections.overall')}
        icon={<BadgeOutlined fontSize="small" />}
        rows={[
          { key: 'position', label: t('profile.fields.position'), value: employee.position.title },
          {
            key: 'category',
            label: t('profile.fields.category'),
            value: employee.position.category.name,
          },
          { key: 'level', label: t('profile.fields.level'), value: mock.level },
          {
            key: 'workEmail',
            label: t('profile.fields.workEmail'),
            value: <Link href={`mailto:${employee.email}`}>{employee.email}</Link>,
          },
          {
            key: 'dob',
            label: t('profile.fields.dateOfBirth'),
            value: t('profile.values.age', { date: date(mock.dateOfBirth), count: age }),
          },
          {
            key: 'start',
            label: t('profile.fields.startDate'),
            value: t('profile.values.tenure', {
              date: date(employee.startDate),
              duration:
                tenure.years === 0 && tenure.months === 0
                  ? t('profile.values.lessThanMonth')
                  : tenure.years === 0
                    ? t('profile.values.months', { count: tenure.months })
                    : tenure.months === 0
                      ? t('profile.values.years', { count: tenure.years })
                      : t('profile.values.yearsAndMonths', {
                          years: t('profile.values.years', { count: tenure.years }),
                          months: t('profile.values.months', { count: tenure.months }),
                        }),
            }),
          },
          ...(employee.terminatedOn && employee.termination
            ? [
                {
                  key: 'terminated',
                  label: t('profile.fields.terminatedOn'),
                  value: date(employee.terminatedOn),
                },
                {
                  key: 'terminationReason',
                  label: t('profile.fields.terminationReason'),
                  value: employee.termination.comment
                    ? `${t(`termination.reasons.${employee.termination.reason}`)} — ${employee.termination.comment}`
                    : t(`termination.reasons.${employee.termination.reason}`),
                },
              ]
            : []),
          {
            key: 'holiday',
            label: t('profile.fields.holidayEligibility'),
            value: date(addMonthsIso(employee.startDate, HOLIDAY_ELIGIBILITY_MONTHS)),
          },
          {
            key: 'laptop',
            label: t('profile.fields.laptopId'),
            value: <span className="app-tabular">{mock.laptopId}</span>,
          },
          { key: 'info', label: t('profile.fields.additionalInfo'), value: mock.additionalInfo },
          {
            key: 'role',
            label: t('profile.fields.systemRole'),
            value: t(`profile.roles.${employee.role}`),
          },
        ]}
      />
      <DetailSection
        title={t('profile.sections.contact')}
        icon={<ContactPhoneOutlined fontSize="small" />}
        rows={[
          {
            key: 'mobile',
            label: t('profile.fields.mobile'),
            value: contacts.mobile && (
              <Link href={`tel:${contacts.mobile.replace(/[^+\d]/g, '')}`}>{contacts.mobile}</Link>
            ),
          },
          {
            key: 'personalEmail',
            label: t('profile.fields.personalEmail'),
            value: contacts.personalEmail && (
              <Link href={`mailto:${contacts.personalEmail}`}>{contacts.personalEmail}</Link>
            ),
          },
          {
            key: 'linkedin',
            label: t('profile.fields.linkedin'),
            value:
              contacts.linkedinUrl &&
              external(
                contacts.linkedinUrl,
                contacts.linkedinUrl.replace(/^https:\/\/(www\.)?/, ''),
              ),
          },
          {
            key: 'telegram',
            label: t('profile.fields.telegram'),
            value:
              contacts.telegram &&
              external(`https://t.me/${contacts.telegram.replace(/^@/, '')}`, contacts.telegram),
          },
          { key: 'address', label: t('profile.fields.address'), value: contacts.address },
        ]}
      />
    </div>
  );
}
