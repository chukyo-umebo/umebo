import * as React from "react";
import { toast } from "@backpackapp-io/react-native-toast";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
    constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        console.log("hello");
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    override componentDidCatch(error: any, info: any) {
        console.log(error, info, React.captureOwnerStack());
        toast.error("予期せぬエラーが発生しました。アプリを再起動してください。");
    }

    override render() {
        if ((this.state as any).hasError) {
            return <></>;
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
