"use client";

import { useSyncExternalStore } from "react";

const SESSION_KEY = "retroflow_session_id";

function getSnapshot(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getServerSnapshot(): string {
  return "";
}

function subscribe(): () => void {
  return () => {};
}

export function useSessionId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
