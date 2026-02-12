import * as React from "react";
import { toast } from "@backpackapp-io/react-native-toast";

type ErrorBoundaryProps = {
    children: React.ReactNode;
    fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
    hasError: boolean;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private defaultErrorHandler?: (error: unknown, isFatal?: boolean) => void;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override componentDidMount() {
        const errorUtils = (global as { ErrorUtils?: any }).ErrorUtils;
        if (errorUtils?.getGlobalHandler && errorUtils?.setGlobalHandler) {
            this.defaultErrorHandler = errorUtils.getGlobalHandler();
            errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
                toast.error(error instanceof Error ? error.message : String(error));
                this.defaultErrorHandler?.(error, isFatal);
            });
        }
    }

    override componentWillUnmount() {
        const errorUtils = (global as { ErrorUtils?: any }).ErrorUtils;
        if (errorUtils?.setGlobalHandler && this.defaultErrorHandler) {
            errorUtils.setGlobalHandler(this.defaultErrorHandler);
        }
    }

    override componentDidCatch(error: unknown, info: unknown) {
        console.log(error, info, React.captureOwnerStack());
        toast.error(error instanceof Error ? error.message : String(error));
    }

    override render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
