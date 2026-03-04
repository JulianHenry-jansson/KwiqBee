'use client';


import { useState } from 'react';
import { Save, X } from 'lucide-react';

interface CorrectionData {
    strength: string;
    broodFrames: number;
    treatment: string;
}

interface CorrectionModuleProps {
    initialData: CorrectionData;
    onSave: (data: CorrectionData) => void;
    onCancel: () => void;
}

export default function CorrectionModule({ initialData, onSave, onCancel }: CorrectionModuleProps) {
    const [formData, setFormData] = useState<CorrectionData>(initialData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'broodFrames' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-amber-50/50 rounded-lg p-5 border border-amber-200 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <h3 className="text-sm font-semibold text-gray-800 mb-4 inline-flex items-center gap-2">
                Korrigera AI-tolkning
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Samhällets styrka</label>
                    <select
                        name="strength"
                        value={formData.strength}
                        onChange={handleChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2 border"
                    >
                        <option value="Mycket svagt">Mycket svagt</option>
                        <option value="Svagt">Svagt</option>
                        <option value="Normalt">Normalt</option>
                        <option value="Starkt">Starkt</option>
                        <option value="Mycket starkt">Mycket starkt</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Ramar med yngel</label>
                    <input
                        type="number"
                        name="broodFrames"
                        value={formData.broodFrames}
                        onChange={handleChange}
                        min="0"
                        max="20"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Behandling</label>
                    <select
                        name="treatment"
                        value={formData.treatment}
                        onChange={handleChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2 border"
                    >
                        <option value="Ingen">Ingen</option>
                        <option value="Oxalsyra">Oxalsyra</option>
                        <option value="Myrsyra">Myrsyra</option>
                        <option value="Apistan">Apistan</option>
                        <option value="Thymol">Thymol</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                    <X className="w-4 h-4" />
                    Avbryt
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                    <Save className="w-4 h-4" />
                    Spara logg
                </button>
            </div>
        </form>
    );
}
