'use client';

import { useState } from 'react';
import { supabaseOrders } from '@/lib/supabase-orders';
import type { Order } from '@/types/database';

interface Props {
  order: Order;
  onUpdate: (updated: Partial<Order>) => void;
}

const STEPS = [
  { key: 'confirmed', label: 'Validée' },
  { key: 'is_processing', label: 'Préparation' },
  { key: 'is_shipped', label: 'Expédié' },
  { key: 'is_delivered', label: 'Livré' },
];

// Icônes SVG épurées
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m10-2V9a1 1 0 00-1-1h-2l-3 4h5a1 1 0 001-1zm0 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const STEP_ICONS = [CheckIcon, BoxIcon, TruckIcon, MapPinIcon];

export default function DeliveryTracker({ order, onUpdate }: Props) {
  const [updating, setUpdating] = useState<string | null>(null);

  const getActiveStep = (): number => {
    if (order.is_delivered) return 3;
    if (order.is_shipped) return 2;
    if (order.is_processing) return 1;
    if (order.status !== 'pending') return 0;
    return -1;
  };

  const activeStep = getActiveStep();

  const handleToggle = async (stepIndex: number) => {
    if (updating) return;
    setUpdating(STEPS[stepIndex].key);

    const isCurrentlyActive = stepIndex <= activeStep;
    const updates: Record<string, any> = {};

    if (isCurrentlyActive) {
      // Désactiver cette étape et les suivantes
      if (stepIndex === 0) {
        updates.status = 'pending';
        updates.is_processing = false;
        updates.is_shipped = false;
        updates.is_delivered = false;
      } else if (stepIndex === 1) {
        updates.is_processing = false;
        updates.is_shipped = false;
        updates.is_delivered = false;
      } else if (stepIndex === 2) {
        updates.is_shipped = false;
        updates.is_delivered = false;
      } else if (stepIndex === 3) {
        updates.is_delivered = false;
      }
    } else {
      // Activer cette étape et les précédentes
      if (stepIndex >= 0) updates.status = 'confirmed';
      if (stepIndex >= 1) updates.is_processing = true;
      if (stepIndex >= 2) updates.is_shipped = true;
      if (stepIndex >= 3) updates.is_delivered = true;
    }

    updates.updated_at = new Date().toISOString();

    console.log('DeliveryTracker update:', { orderId: order.id, updates });

    const { error, data, count } = await supabaseOrders
      .from('orders')
      .update(updates)
      .eq('id', order.id)
      .select();

    console.log('DeliveryTracker result:', { error, data, count });

    if (error) {
      console.error('DeliveryTracker error:', error);
    } else if (data && data.length > 0) {
      onUpdate(updates);
    }

    setUpdating(null);
  };

  return (
    <div className="bg-gradient-to-b from-slate-50/90 to-gray-50/80 border border-gray-100 rounded-xl p-3.5 mt-2">
      <div className="flex items-center justify-between mb-3.5">
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Suivi de livraison
        </h4>
        <span className="text-[10px] text-gray-400 font-medium">Cliquez pour actualiser</span>
      </div>

      {/* Barre de progression */}
      <div className="relative mb-3.5 px-1">
        <div className="absolute top-[17px] left-6 right-6 h-0.5 bg-gray-200/80 rounded-full">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(0, (activeStep / 3) * 100)}%` }}
          />
        </div>

        <div className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const isActive = idx <= activeStep;
            const isCurrent = idx === activeStep;
            const StepIcon = STEP_ICONS[idx];

            return (
              <div key={step.key} className="flex flex-col items-center z-10">
                <button
                  onClick={() => handleToggle(idx)}
                  disabled={updating !== null}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-100'
                      : 'bg-white border border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 shadow-2xs'
                  } ${isCurrent ? 'ring-3 ring-emerald-300/60 ring-offset-1' : ''} ${
                    updating === step.key ? 'animate-pulse' : ''
                  }`}
                  title={step.label}
                >
                  <StepIcon />
                </button>
                <span className={`text-[10px] mt-1.5 font-medium tracking-tight ${
                  isActive ? 'text-emerald-700 font-semibold' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statut texte */}
      <div className="text-center pt-1">
        <span className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-3 py-1 rounded-full border ${
          order.is_delivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
          order.is_shipped ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
          order.is_processing ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' :
          order.status !== 'pending' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
          'bg-gray-100/90 text-gray-600 border-gray-200/60'
        }`}>
          <span>
            {order.is_delivered ? 'Livré au client' :
             order.is_shipped ? 'En cours de livraison' :
             order.is_processing ? 'En préparation' :
             order.status !== 'pending' ? 'Commande validée' :
             'En attente de validation'}
          </span>
        </span>
      </div>
    </div>
  );
}
