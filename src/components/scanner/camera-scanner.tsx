"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Dynamic import for SSR compatibility
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <Camera className="h-12 w-12 text-muted-foreground animate-pulse" />
      </div>
    ),
  }
);

export enum CameraPermissionState {
  UNKNOWN = "unknown",
  GRANTED = "granted",
  DENIED = "denied",
  PROMPT = "prompt",
}

export enum ScannerState {
  INITIALIZING = "initializing",
  ACTIVE = "active",
  STOPPED = "stopped",
  ERROR = "error",
}

interface CameraScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
  className?: string;
}

export function CameraScanner({
  onScan,
  onError,
  isActive,
  className,
}: CameraScannerProps) {
  const [scannerState, setScannerState] = useState<ScannerState>(
    ScannerState.INITIALIZING
  );
  const [permissionState, setPermissionState] = useState<CameraPermissionState>(
    CameraPermissionState.UNKNOWN
  );
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);

  // Check for camera devices and permissions
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Camera access is not supported on this device");
          setScannerState(ScannerState.ERROR);
          setPermissionState(CameraPermissionState.DENIED);
          return;
        }

        // Get available video devices
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(
          (device) => device.kind === "videoinput"
        );

        setDevices(videoDevices);
        setHasMultipleCameras(videoDevices.length > 1);

        // Check camera permissions
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });

          setPermissionState(permissionStatus.state as CameraPermissionState);

          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state as CameraPermissionState);
          };
        } catch (permissionError) {
          // Permissions API might not be supported, try to request camera access
          setPermissionState(CameraPermissionState.PROMPT);
        }
      } catch (error) {
        console.error("Error checking camera support:", error);
        setError("Failed to access camera devices");
        setScannerState(ScannerState.ERROR);
      }
    };

    if (isActive) {
      checkCameraSupport();
    }
  }, [isActive]);

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedText = result[0]?.rawValue || result[0]?.text || result;
      if (scannedText && scannedText.length >= 4) {
        setScannerState(ScannerState.ACTIVE);
        setError(null);
        onScan(scannedText);
      }
    }
  };

  const handleError = (error: any) => {
    console.error("Camera scanner error:", error);

    let errorMessage = "Camera scanning error occurred";

    if (error?.name === "NotAllowedError") {
      errorMessage = "Camera access was denied. Please allow camera permissions in your browser.";
      setPermissionState(CameraPermissionState.DENIED);
    } else if (error?.name === "NotFoundError") {
      errorMessage = "No camera found on this device.";
    } else if (error?.name === "NotSupportedError") {
      errorMessage = "Camera scanning is not supported on this device or browser.";
    } else if (error?.name === "NotReadableError") {
      errorMessage = "Camera is already in use by another application.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    setError(errorMessage);
    setScannerState(ScannerState.ERROR);

    if (onError) {
      onError(errorMessage);
    }
  };

  const toggleTorch = () => {
    // Note: Torch control varies by device and browser support
    setTorchEnabled(!torchEnabled);
    // The actual torch control will be implemented when the scanner supports it
  };

  const switchCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  const startScanning = () => {
    setScannerState(ScannerState.ACTIVE);
    setError(null);
  };

  const stopScanning = () => {
    setScannerState(ScannerState.STOPPED);
  };

  const renderPermissionGuide = () => {
    if (permissionState === CameraPermissionState.DENIED) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Camera access is required for scanning. Please:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click the camera icon in your browser's address bar</li>
              <li>Select "Always allow" for camera access</li>
              <li>Refresh the page if needed</li>
            </ul>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const renderCameraControls = () => {
    if (scannerState !== ScannerState.ACTIVE) return null;

    return (
      <div className="flex justify-center space-x-2 mt-4">
        {hasMultipleCameras && (
          <Button
            variant="outline"
            size="sm"
            onClick={switchCamera}
            className="flex items-center space-x-1"
          >
            <SwitchCamera className="h-4 w-4" />
            <span>Switch</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={toggleTorch}
          className="flex items-center space-x-1"
        >
          {torchEnabled ? (
            <FlashlightOff className="h-4 w-4" />
          ) : (
            <Flashlight className="h-4 w-4" />
          )}
          <span>Flash</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={stopScanning}
          className="flex items-center space-x-1"
        >
          <CameraOff className="h-4 w-4" />
          <span>Stop</span>
        </Button>
      </div>
    );
  };

  const renderScannerContent = () => {
    if (!isActive) {
      return (
        <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center space-y-3">
          <Camera className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Camera scanner is inactive
          </p>
        </div>
      );
    }

    if (error || scannerState === ScannerState.ERROR) {
      return (
        <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center space-y-3 p-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-sm text-red-600 text-center">{error}</p>
          {permissionState !== CameraPermissionState.DENIED && (
            <Button variant="outline" size="sm" onClick={startScanning}>
              <Camera className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      );
    }

    if (scannerState === ScannerState.STOPPED) {
      return (
        <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center space-y-3">
          <CameraOff className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Camera scanning stopped
          </p>
          <Button variant="outline" size="sm" onClick={startScanning}>
            <Camera className="h-4 w-4 mr-2" />
            Start Scanning
          </Button>
        </div>
      );
    }

    if (permissionState === CameraPermissionState.DENIED) {
      return (
        <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center space-y-3 p-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-sm text-red-600 text-center">
            Camera access denied
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Please enable camera permissions to scan barcodes
          </p>
        </div>
      );
    }

    // Show active scanner
    return (
      <div className="relative">
        <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{
              facingMode,
              aspectRatio: 1,
            }}
            components={{
              onOff: false,
              torch: torchEnabled,
              zoom: false,
              finder: false,
            }}
            styles={{
              container: {
                width: "100%",
                height: "100%",
              },
              video: {
                width: "100%",
                height: "100%",
                objectFit: "cover",
              },
            }}
          />

          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-white/60 rounded-lg relative">
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          </div>

          {/* Scanning status */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/60 text-white text-sm px-3 py-1 rounded-full">
              Scanning for barcodes...
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {renderPermissionGuide()}
      {renderScannerContent()}
      {renderCameraControls()}
    </div>
  );
}