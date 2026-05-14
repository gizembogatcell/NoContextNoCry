"use client";

import { Button, Flex, Result } from "antd";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorPageProps) {
  return (
    <Flex align="center" justify="center" style={{ minHeight: "60vh" }}>
      <Result
        status="error"
        title="Something went wrong"
        subTitle={error.message || "An unexpected error occurred."}
        extra={
          <Button type="primary" onClick={reset}>
            Try again
          </Button>
        }
      />
    </Flex>
  );
}
