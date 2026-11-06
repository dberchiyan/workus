import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Component, type ReactNode } from 'react';
import { Translation } from 'react-i18next';

export interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/** The only class component: catches render errors of one route. */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  override state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <Translation>
        {(t) => (
          <div
            role="alert"
            className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6"
          >
            <Typography variant="h4" component="h1">
              {t('errorBoundary.title')}
            </Typography>
            <Typography variant="body1">{t('errorBoundary.description')}</Typography>
            <Button
              variant="contained"
              onClick={() => {
                this.setState({ hasError: false });
              }}
              className="self-start"
            >
              {t('errorBoundary.retry')}
            </Button>
          </div>
        )}
      </Translation>
    );
  }
}
