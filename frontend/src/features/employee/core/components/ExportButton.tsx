import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Snackbar from '@mui/material/Snackbar';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpgrade } from '@/features/auth';
import { UpgradePrompt } from '@/shared/components/UpgradePrompt';
import { useEmployeeExport, type EmployeeExportKind } from '../hooks/useEmployeeExport';

export interface ExportButtonProps {
    employeeId: string;
    kind: EmployeeExportKind;
}

/**
 * Downloads the tab's CSV (Business plan). On a lower plan the click opens the upgrade prompt
 * — the API would refuse the download anyway.
 */
export function ExportButton({ employeeId, kind }: ExportButtonProps) {
    const { t } = useTranslation('employee');
    const upgrade = useUpgrade('exports');
    const download = useEmployeeExport(employeeId, kind);
    const [promptOpen, setPromptOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    return (
        <>
            <Button
                ref={buttonRef}
                size="small"
                startIcon={<DownloadOutlined aria-hidden />}
                loading={download.isPending}
                onClick={() => {
                    if (upgrade.locked) {
                        setPromptOpen(true);
                    } else {
                        download.mutate();
                    }
                }}
            >
                {t(`profile.export.${kind}`)}
            </Button>
            <Dialog
                open={promptOpen}
                onClose={() => {
                    setPromptOpen(false);
                }}
                slotProps={{ transition: { onExited: () => buttonRef.current?.focus() } }}
                maxWidth="xs"
                fullWidth
            >
                <DialogContent>
                    <UpgradePrompt
                        reason={{ kind: 'feature', feature: 'exports' }}
                        requiredPlan={upgrade.requiredPlan}
                        canManage={upgrade.canManage}
                        className="py-4"
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setPromptOpen(false);
                        }}
                    >
                        {t('profile.export.close')}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={download.isError}
                onClose={(_event, reason) => {
                    if (reason !== 'clickaway') {
                        download.reset();
                    }
                }}
                message={t('profile.export.failed')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                slotProps={{ content: { role: 'alert' } }}
            />
        </>
    );
}
