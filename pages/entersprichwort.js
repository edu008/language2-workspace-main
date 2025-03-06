import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSprichwort } from "../prisma/sprichwort";

// Modern UI components
import { X, Send, Save, Search } from 'lucide-react';
import FormField from '@/components/WordGarden/FormField';
import TextField from '@/components/WordGarden/TextField';
import Button from '@/components/WordGarden/Button';
import SuggestionList from '@/components/WordGarden/SuggestionList';
import MessageToast from '@/components/WordGarden/MessageToast';
import Header from '@/components/layout/Header';

export async function getServerSideProps(context) {
    const session = await getSession(context);
    
    if (!session) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }
    
    try {
        const sprichwortRaw = await getSprichwort() || [];
        const formattedSprichwort = sprichwortRaw.map(item => ({
            ...item,
            Datum: item.Datum instanceof Date ? item.Datum.toISOString() : item.Datum
        }));
        return {
            props: {
                sprichwort: formattedSprichwort
            }
        };
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return {
            props: {
                sprichwort: [],
                error: 'Failed to load data'
            }
        };
    }
}

export default function Sprichwort({ sprichwort }) {
    const { data: session } = useSession();
    const router = useRouter();
    
    // Form state
    const [id, setId] = useState("");
    const [newWort, setNewWort] = useState("");
    const [newSprichwort, setNewSprichwort] = useState("");
    const [newErklaerung, setNewErklaerung] = useState("");
    const [newBeispiel, setNewBeispiel] = useState("");
    const [newQuelle, setNewQuelle] = useState("");
    const [newDatum, setNewDatum] = useState("");
    
    // UI state
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [suggestions, setSuggestions] = useState([]);
    const [searchInput, setSearchInput] = useState("");

    // Update suggestions with guard clause
    const updateSuggestions = (inputValue) => {
        if (!Array.isArray(sprichwort)) {
            setSuggestions([]);
            return;
        }
        const filteredResults = sprichwort.filter((item) =>
            item?.Sprichwort?.toLowerCase().includes(inputValue.toLowerCase())
        );
        setSuggestions(filteredResults);
    };

    const refreshPage = () => {
        router.replace(router.asPath, undefined, { scroll: false });
    };

    // Reset form fields
    const resetForm = () => {
        setId('');
        setNewWort('');
        setNewSprichwort('');
        setNewErklaerung('');
        setNewBeispiel('');
        setNewQuelle('');
        setNewDatum('');
        setSearchInput('');
        setSuggestions([]);
    };

    // Set form with data from selected item
    const setForm = (item) => {
        if (!item) return;
        
        setId(item.id || '');
        setNewWort(item.Wort || '');
        setNewSprichwort(item.Sprichwort || '');
        setNewErklaerung(item.Erklaerung || '');
        setNewBeispiel(item.Beispiel || '');
        setNewQuelle(item.Quelle || '');
        setNewDatum(item.Datum ? new Date(item.Datum).toISOString().split('T')[0] : '');
    };

    // Handle search focus
    const handleSearchFocus = () => {
        if (Array.isArray(sprichwort)) {
            setSuggestions(sprichwort);
        }
    };

    // Handle search blur
    const handleSearchBlur = () => {
        setTimeout(() => {
            setSuggestions([]);
        }, 200);
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (item) => {
        setForm(item);
        setSearchInput(item.Sprichwort);
        setSuggestions([]);
    };

    // Validate form before submission
    const validateForm = () => {
        const errors = [];
        if (!newWort.trim()) errors.push('Wort ist erforderlich');
        if (!newSprichwort.trim()) errors.push('Sprichwort ist erforderlich');
        if (!newErklaerung.trim()) errors.push('Erklärung ist erforderlich');
        if (!newBeispiel.trim()) errors.push('Beispiel ist erforderlich');
        if (!newQuelle.trim()) errors.push('Quelle ist erforderlich');
        if (!newDatum) errors.push('Datum ist erforderlich');
        
        if (errors.length > 0) {
            setMessage(errors.join('. '));
            setMessageType('error');
            setTimeout(() => {
                setMessage('');
            }, 10000);
            return false;
        }
        return true;
    };

    // Add new sprichwort
    const addSprichwort = async () => {
        if (!validateForm()) return;

        try {
            const response = await fetch('/api/sprichwort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Wort: newWort,
                    Sprichwort: newSprichwort,
                    Erklaerung: newErklaerung,
                    Beispiel: newBeispiel,
                    Quelle: newQuelle,
                    Datum: newDatum
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Speichern');
            }

            const data = await response.json();
            resetForm();
            setMessage("Sprichwort erfolgreich hinzugefügt!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error adding sprichwort:", error);
            setMessage(`Fehler beim Hinzufügen des Sprichworts: ${error.message}`);
            setMessageType("error");
            setTimeout(() => {
                setMessage("");
            }, 10000);
        }
    };

    // Update existing sprichwort
    const updateSprichwort = async () => {
        if (!validateForm()) return;

        try {
            const response = await fetch('/api/sprichwort', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    Wort: newWort,
                    Sprichwort: newSprichwort,
                    Erklaerung: newErklaerung,
                    Beispiel: newBeispiel,
                    Quelle: newQuelle,
                    Datum: newDatum
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Aktualisieren');
            }

            const data = await response.json();
            resetForm();
            setMessage("Sprichwort erfolgreich aktualisiert!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error updating sprichwort:", error);
            setMessage(`Fehler beim Aktualisieren des Sprichworts: ${error.message}`);
            setMessageType("error");
            setTimeout(() => {
                setMessage("");
            }, 10000);
        }
    };

    return (
        <div className="min-h-screen bg-wg-neutral-50">
            {/* Header */}
            <Header session={session} />

            {/* Main Content */}
            <main className="container mx-auto py-8 px-4">
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-wg-neutral-200 p-6 mb-8 mt-24">
                    
                    {/* Suchfeld für bestehende Sprichwörter */}
                    <div className="mb-8 relative">
                        <FormField
                            id="search"
                            label="Sprichwort zum Bearbeiten suchen:"
                            helpText="Geben Sie den Anfang eines Sprichworts ein, um es zu finden"
                        >
                            <div className="relative">
                                <TextField
                                    id="search"
                                    value={searchInput}
                                    onChange={(e) => {
                                        setSearchInput(e.target.value);
                                        updateSuggestions(e.target.value);
                                    }}
                                    placeholder="Suchen..."
                                    onFocus={handleSearchFocus}
                                    onBlur={handleSearchBlur}
                                    className="pl-10"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-wg-neutral-500">
                                    <Search size={18} />
                                </div>
                            </div>
                        </FormField>
                        <SuggestionList
                            suggestions={suggestions}
                            onSelect={handleSuggestionSelect}
                            onCancel={() => setSuggestions([])}
                            displayField="Sprichwort"
                        />
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <FormField id="wort" label="Hauptwort:" className="mb-4">
                                <TextField
                                    id="wort"
                                    value={newWort}
                                    onChange={(e) => setNewWort(e.target.value)}
                                    placeholder="z.B. Zeit"
                                />
                            </FormField>
                            <FormField id="sprichwort" label="Sprichwort:" className="mb-4">
                                <TextField
                                    id="sprichwort"
                                    value={newSprichwort}
                                    onChange={(e) => setNewSprichwort(e.target.value)}
                                    placeholder="z.B. Zeit heilt alle Wunden."
                                />
                            </FormField>
                            <FormField id="erklaerung" label="Erklärung:" className="mb-4">
                                <TextField
                                    id="erklaerung"
                                    value={newErklaerung}
                                    onChange={(e) => setNewErklaerung(e.target.value)}
                                    placeholder="z.B. Mit der Zeit verschwinden Schmerzen."
                                />
                            </FormField>
                        </div>
                        <div>
                            <FormField id="beispiel" label="Beispiel:" className="mb-4">
                                <TextField
                                    id="beispiel"
                                    value={newBeispiel}
                                    onChange={(e) => setNewBeispiel(e.target.value)}
                                    placeholder="z.B. Nach dem Verlust hat er Zeit gebraucht."
                                />
                            </FormField>
                            <FormField id="quelle" label="Quelle:" className="mb-4">
                                <TextField
                                    id="quelle"
                                    value={newQuelle}
                                    onChange={(e) => setNewQuelle(e.target.value)}
                                    placeholder="z.B. Volksweisheit"
                                />
                            </FormField>
                            <FormField id="datum" label="Datum:" className="mb-4">
                                <TextField
                                    id="datum"
                                    type="date"
                                    value={newDatum}
                                    onChange={(e) => setNewDatum(e.target.value)}
                                    placeholder="Datum"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={resetForm}
                            icon={<X size={18} />}
                            className="w-40"
                        >
                            Zurücksetzen
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={id ? updateSprichwort : addSprichwort}
                            icon={id ? <Save size={18} /> : <Send size={18} />}
                            className="w-40"
                        >
                            {id ? 'Aktualisieren' : 'Speichern'}
                        </Button>
                    </div>
                </div>
            </main>

            {/* Toast Message */}
            {message && (
                <MessageToast
                    message={message}
                    type={messageType}
                    onClose={() => setMessage('')}
                />
            )}
        </div>
    );
}