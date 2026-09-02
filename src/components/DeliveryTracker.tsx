'use client';

import { useState } from 'react';
import { supabaseOrders } from '@/lib/supabase-orders';
import type { Order } from '@/types/database';

interface Props {
  order: Order;
  onUpdate: (updated: Partial<Order>) => void;
}

const STEPS = [
  { key: 'confirmed', label: 'Confirmée', icon: '✅', field: null },
  { key: 'is_processing', label: 'Préparation', icon: '📋', field: 'is_processing' as const },
  { key: 'is_shipped', label: 'Expédié', icon: '🚚', field: 'is_shipped' as const },
  { key: 'is_delivered', label: 'Livré', icon: '📍', field: 'is_delivered' as const },
];

export default function DeliveryTracker({ order, onUpdate }: Props) {
  const [updating, setUpdating] = useState<string | null>(null);

  // Déterminer l'étape actuelle
  const getActiveStep = (): number => {
    if (order.is_delivered) return 3;
    if (order.is_shipped) return 2;
    if (order.is_processing) return 1;
    if (order.status !== 'pending') return 0;
    return -1;
  };

  const activeStep = getActiveStep();

  const handleToggle = async (field: 'is_processing' | 'is_shipped' | 'is_delivered', stepIndex: number) => {
    if (updating) return;
    setUpdating(field);

    // Si on active une étape, on active aussi les précédentes
    // Si on désactive, on désactive aussi les suivantes
    const isCurrentlyActive = order[field];
    const updates: Partial<Order> = {};

    if (isCurrentlyActive) {
      // Désactiver cette étape et les suivantes
      if (stepIndex <= 1) { updates.is_processing = false; updates.is_shipped = false; updates.is_delivered = false; }
      else if (stepIndex === 2) { updates.is_shipped = false; updates.is_delivered = false; }
      else if (stepIndex === 3) { updates.is_delivered = false; }
    } else {
      // Activer cette étape et les précédentes
      if (stepIndex >= 1) updates.is_processing = true;
      if (stepIndex >= 2) updates.is_shipped = true;
      if (stepIndex >= 3) updates.is_delivered = true;
    }

    const { error } = await supabaseOrders
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (!error) {
      onUpdate(updates);
    }

    setUpdating(null);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mt-1">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        🚚 Suivi de livraison
      </h4>

      {/* Barre de progression */}
      <div className="relative mb-4">
        <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(activeStep / 3) * 100}%` }}
          />
        </div>

        <div className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const isActive = idx <= activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div key={step.key} className="flex flex-col items-center z-10">
                {step.field ? (
                  <button
                    onClick={() => handleToggle(step.field!, idx)}
                    disabled={updating !== null}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-green-500 text-white shadow-md scale-110'
                        : 'bg-white border-2 border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500'
                    } ${isCurrent ? 'ring-2 ring-green-300 ring-offset-1' : ''} ${
                      updating === step.field ? 'animate-pulse' : ''
                    }`}
                  >
                    {step.icon}
                  </button>
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                    isActive ? 'bg-green-500 text-white shadow-md' : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                )}
                <span className={`text-[10px] mt-1.5 font-medium ${
                  isActive ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statut texte */}
      <div className="text-center">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          order.is_delivered ? 'bg-green-100 text-green-700' :
          order.is_shipped ? 'bg-purple-100 text-purple-700' :
          order.is_processing ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {order.is_delivered ? '✅ Livré au client' :
           order.is_shipped ? '🚚 En cours de livraison' :
           order.is_processing ? '📋 En préparation' :
           '⏳ En attente de traitement'}
        </span>
      </div>
    </div>
  );
}
