import { Component } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from 'react';
import { themes } from '../theme/themes';
import { typography as typographyTokens, borderRadius, spacing } from '../theme/tokens';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const theme = themes.dark;
      const colors = theme.colors;

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing['2xl'],
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>⚠️</Text>
          <Text
            style={{
              color: colors.text,
              fontSize: typographyTokens.sizes.lg,
              fontWeight: typographyTokens.weights.semibold,
              textAlign: 'center',
              marginBottom: spacing.xs,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: typographyTokens.sizes.sm,
              textAlign: 'center',
              marginBottom: spacing.lg,
              lineHeight: 20,
            }}
            numberOfLines={3}
          >
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable
            onPress={this.handleReset}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.full,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: typographyTokens.sizes.md,
                fontWeight: typographyTokens.weights.semibold,
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary(Component: React.ComponentType<any>, fallback?: ReactNode) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return function WrappedComponent(props: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
