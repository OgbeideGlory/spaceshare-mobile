import { useRef } from 'react'
import { Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import Button from '@/components/ui/Button'

// Shows the camera and calls onScan(text) once a QR code is read.
// Much simpler than the web version: the phone's camera reads QR codes by itself.
export default function QrScanner({ onScan }) {
  const [permission, requestPermission] = useCameraPermissions()
  // The camera reports the same code many times a second; only use the first one
  const scanned = useRef(false)

  if (!permission) return null // still checking

  if (!permission.granted) {
    return (
      <View className="items-center gap-3 rounded-lg bg-gray-50 p-4">
        <Text className="text-center text-sm text-gray-700">
          {permission.canAskAgain
            ? 'Allow the camera to scan the guest’s QR code.'
            : 'Camera access is turned off. Turn it on in your phone’s Settings, or type the code instead.'}
        </Text>
        {permission.canAskAgain && (
          <Button variant="accent" onPress={requestPermission}>
            Allow camera
          </Button>
        )}
      </View>
    )
  }

  return (
    <View
      accessibilityLabel="Camera view for scanning the guest's QR code"
      className="aspect-square w-full overflow-hidden rounded-lg bg-black"
    >
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (scanned.current || !data) return
          scanned.current = true
          onScan(data)
        }}
      />
    </View>
  )
}
