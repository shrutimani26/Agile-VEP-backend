import React, { useState } from 'react';

interface Card {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  holderName: string;
  isDefault: boolean;
}

const Payment: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([
    { id: 'c1', type: 'visa', last4: '4242', expiry: '12/26', holderName: 'AHMAD ISMAIL', isDefault: true },
    { id: 'c2', type: 'mastercard', last4: '8888', expiry: '08/25', holderName: 'AHMAD ISMAIL', isDefault: false },
  ]);

  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const handleEdit = (card: Card) => {
    setEditingCard({ ...card });
  };

  const handleSave = () => {
    if (editingCard) {
      setCards(cards.map(c => c.id === editingCard.id ? editingCard : c));
      setEditingCard(null);
    }
  };

  const handleSetDefault = (id: string) => {
    setCards(cards.map(c => ({ ...c, isDefault: c.id === id })));
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-10">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Payment Methods</h2>
          <p className="text-slate-500 text-xs mt-1">Manage your secure payment options for permits and tolls.</p>
        </div>
        <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-[11px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm">
          Add Card
        </button>
      </div>

      <div className="grid gap-4">
        {cards.map(card => (
          <div key={card.id} className={`group relative p-6 rounded-2xl border transition-all duration-300 ${card.isDefault ? 'border-emerald-200 bg-emerald-50/20 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-slate-50 border border-slate-100 rounded flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">{card.type}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">•••• {card.last4}</p>
                    {card.isDefault && (
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{card.holderName} • Exp {card.expiry}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!card.isDefault && (
                  <button 
                    onClick={() => handleSetDefault(card.id)}
                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-wider transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Set Default
                  </button>
                )}
                <button 
                  onClick={() => handleEdit(card)} 
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingCard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Edit Card Details</h3>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Card Holder</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none text-sm font-medium"
                  value={editingCard.holderName}
                  onChange={e => setEditingCard({...editingCard, holderName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none text-sm font-medium"
                    value={editingCard.expiry}
                    onChange={e => setEditingCard({...editingCard, expiry: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 4</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none text-sm font-medium"
                    value={editingCard.last4}
                    onChange={e => setEditingCard({...editingCard, last4: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingCard(null)} className="flex-1 py-3 bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-all">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;