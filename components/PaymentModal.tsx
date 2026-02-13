import React, { useState, useMemo } from 'react';
import XIcon from './icons/XIcon';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number) => Promise<void>;
    clientName: string;
    totalOwed: number;
    currentPayment?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSubmit, clientName, totalOwed, currentPayment }) => {
    const [amount, setAmount] = useState<string>(currentPayment?.toString() || '');
    const [isLoading, setIsLoading] = useState(false);

    // Calculate preset amounts
    const presets = useMemo(() => ({
        full: totalOwed,
        half: totalOwed / 2,
        custom: amount ? parseFloat(amount) : 0,
    }), [totalOwed, amount]);

    const handlePresetClick = (preset: 'full' | 'half') => {
        setAmount(presets[preset].toFixed(2));
    };

    const handleSubmit = async () => {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (paymentAmount > totalOwed) {
            alert(`Payment amount (${paymentAmount}) cannot exceed total owed (${totalOwed.toFixed(2)})`);
            return;
        }
        
        setIsLoading(true);
        try {
            await onSubmit(paymentAmount);
            setAmount('');
            onClose();
        } catch (error) {
            alert('Failed to record payment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const remaining = totalOwed - (amount ? parseFloat(amount) : 0);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-primary">Record Payment</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <XIcon className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Client</label>
                            <p className="text-lg font-bold text-primary">{clientName}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Total Amount Owed</label>
                            <p className="text-3xl font-bold text-orange-600">${totalOwed.toFixed(2)}</p>
                        </div>

                        {/* Payment input */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-3">
                                Amount to Record
                            </label>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl font-bold text-slate-600">$</span>
                                <input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg disabled:bg-slate-100"
                                />
                            </div>

                            {/* Preset buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => handlePresetClick('half')}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                    50% Half
                                    <div className="text-sm font-normal">${presets.half.toFixed(2)}</div>
                                </button>
                                <button
                                    onClick={() => handlePresetClick('full')}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                >
                                    100% Full
                                    <div className="text-sm font-normal">${presets.full.toFixed(2)}</div>
                                </button>
                            </div>
                        </div>

                        {/* Remaining balance */}
                        {amount && parseFloat(amount) > 0 && (
                            <div className={`rounded-lg p-4 ${remaining > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                                <p className={`text-sm font-semibold ${remaining > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                                    Remaining to Collect:
                                </p>
                                <p className={`text-2xl font-bold ${remaining > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    ${remaining.toFixed(2)}
                                </p>
                                {remaining === 0 && (
                                    <p className="text-xs text-green-700 mt-1">✓ Fully paid!</p>
                                )}
                            </div>
                        )}

                        {currentPayment && currentPayment > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700">
                                    <span className="font-semibold">Previously Recorded:</span> ${currentPayment.toFixed(2)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">This will be updated with new amount</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-slate-700 font-semibold hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !amount}
                            className="flex-1 px-4 py-2 bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                            {isLoading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentModal;
