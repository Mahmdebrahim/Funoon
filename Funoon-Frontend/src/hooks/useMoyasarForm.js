import { useEffect, useRef, useState, useCallback } from "react";

const MOYASAR_JS = "https://cdn.moyasar.com/mpf/1.12.0/moyasar.js";
const MOYASAR_CSS = "https://cdn.moyasar.com/mpf/1.12.0/moyasar.css";

export function useMoyasarForm({
  containerRef,
  invoiceId,
  amount,
  description = "Funoon.sa",
  callbackPath = "/payment/success",
  enabled = true,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const observerRef = useRef(null);
  const fallbackRef = useRef(null);
  const initCountRef = useRef(0);
  const hasInitRun = useRef(false); // <--- 1. ده العلم الجديد

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }
  }, []);

  const initForm = useCallback(() => {
    if (!enabled || !invoiceId) return; // <--- صلحت دي كان ناقص ||

    const container = containerRef.current;
    if (!container) {
      setTimeout(initForm, 100);
      return;
    }
    if (!window.Moyasar) {
      setTimeout(initForm, 100);
      return;
    }

    cleanup();

    initCountRef.current += 1;
    const thisInitId = initCountRef.current;

    container.innerHTML = "";
    setIsLoading(true);
    setError(false);

    const observer = new MutationObserver(() => {
      if (thisInitId !== initCountRef.current) {
        observer.disconnect();
        return;
      }

      const hasForm =
        container.querySelector("form") ||
        container.querySelector("input") ||
        container.querySelector(".mysr-form") ||
        container.childNodes.length > 0;

      if (hasForm) {
        console.log("[Moyasar] form rendered ✅");
        setIsLoading(false);
        setError(false);
        observer.disconnect();
        observerRef.current = null;
        if (fallbackRef.current) {
          clearTimeout(fallbackRef.current);
          fallbackRef.current = null;
        }
      }
    });

    observerRef.current = observer;
    observer.observe(container, { childList: true, subtree: true });

    try {
      window.Moyasar.init({
        element: container,
        amount: Math.round(amount * 100),
        currency: "SAR",
        description,
        publishable_api_key: import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY,
        callback_url: `${window.location.origin}${callbackPath}`,
        invoice_id: invoiceId,
        methods: ["creditcard"],
      });
    } catch (err) {
      console.error("[Moyasar] init threw error:", err);
      observer.disconnect();
      observerRef.current = null;
      setError(true);
      setIsLoading(false);
      return;
    }

    fallbackRef.current = setTimeout(() => {
      if (thisInitId !== initCountRef.current) return;

      const hasForm =
        container.querySelector("form") ||
        container.querySelector("input") ||
        container.querySelector(".mysr-form");

      if (!hasForm) {
        console.warn("[Moyasar] fallback — form failed to render");
        setIsLoading(false);
        setError(true);
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      } else {
        console.log("[Moyasar] fallback — form rendered, ignoring");
        setIsLoading(false);
        setError(false);
      }
    }, 6000);
  }, [
    enabled,
    invoiceId,
    amount,
    description,
    callbackPath,
    containerRef,
    cleanup,
  ]);

  useEffect(() => {
    if (!enabled || !invoiceId || hasInitRun.current) return;
    hasInitRun.current = true;

    if (!document.getElementById("moyasar-css")) {
      const link = document.createElement("link");
      link.id = "moyasar-css";
      link.rel = "stylesheet";
      link.href = MOYASAR_CSS;
      document.head.appendChild(link);
    }

    // <--- 4. حماية اضافية عشان السكربت ميتضافش مرتين
    if (
      !window.Moyasar &&
      !document.querySelector(`script[src="${MOYASAR_JS}"]`)
    ) {
      const script = document.createElement("script");
      script.src = MOYASAR_JS;
      script.async = true;
      script.onload = () => {
        console.log("[Moyasar] script loaded");
        initForm();
      };
      script.onerror = () => {
        console.error("[Moyasar] script failed to load");
        setError(true);
        setIsLoading(false);
      };
      document.body.appendChild(script);
    } else {
      initForm();
    }

    return cleanup;
  }, [enabled, invoiceId, initForm, cleanup]);

  const retry = useCallback(() => {
    hasInitRun.current = false; // <--- 5. صفّر العلم عشان يعيد
    setError(false);
    setIsLoading(true);
    initForm();
  }, [initForm]);

  return { isLoading, error, retry };
}
