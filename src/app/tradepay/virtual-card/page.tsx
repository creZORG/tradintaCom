
import { VirtualCard } from '@/components/tradepay/VirtualCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VirtualCardPage() {
  return (
    <div className="bg-gradient-to-br from-blue-900 via-gray-900 to-black min-h-screen py-12">
        <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
                <div className="max-w-md text-white/90">
                    <h1 className="text-4xl font-bold font-headline mb-4">Your Secure Virtual Card</h1>
                    <p className="text-lg text-white/70 mb-6">
                        This is a visual representation of your TradePay virtual card. Use it for secure online payments, powered by the Tradinta ecosystem. Your full card details are encrypted and are never stored on your device.
                    </p>
                    <p className='text-sm text-white/50'>
                        This interactive card is a demonstration of the visual and interactive elements. The displayed data is for example purposes only.
                    </p>
                </div>
                <VirtualCard />
            </div>
        </div>
    </div>
  );
}
