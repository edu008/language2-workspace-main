import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getRedewendung } from "../prisma/redewendung";

// Modern UI components
import { X, Send, Save, Search } from 'lucide-react';
import FormField from '@/components/WordGarden/FormField';
import TextField from '@/components/WordGarden/TextField';
import Button from '@/components/WordGarden/Button';
import SuggestionList from '@/components/WordGarden/SuggestionList';
import MessageToast from '@/components/WordGarden/MessageToast';
import Header from '@/components/deutsch/Header';

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
        const redewendungRaw = await getRedewendung() || [];
        const formattedRedewendung = redewendungRaw.map(item => ({
            ...item,
            Datum: item.Datum instanceof Date ? item.Datum.toISOString() : item.Datum
        }));
        return {
            props: {
                redewendung: formattedRedewendung
            }
        };
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return {
            props: {
                redewendung: [],
                error: 'Failed to load data'
            }
        };
    }
}

export default function Redewendung({ redewendung }) {
    const { data: session } = useSession();
    const router = useRouter();
    
    // Form state
    const [id, setId] = useState("");
    const [newWort, setNewWort] = useState("");
    const [newRedewendung, setNewRedewendung] = useState("");
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
        if (!Array.isArray(redewendung)) {
            setSuggestions([]);
            return;
        }
        const filteredResults = redewendung.filter((item) =>
            item?.Redewendung?.toLowerCase().includes(inputValue.toLowerCase())
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
        setNewRedewendung('');
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
        setNewRedewendung(item.Redewendung || '');
        setNewErklaerung(item.Erklaerung || '');
        setNewBeispiel(item.Beispiel || '');
        setNewQuelle(item.Quelle || '');
        setNewDatum(item.Datum ? new Date(item.Datum).toISOString().split('T')[0] : '');
    };

    // Handle search focus
    const handleSearchFocus = () => {
        if (Array.isArray(redewendung)) {
            setSuggestions(redewendung);
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
        setSearchInput(item.Redewendung);
        setSuggestions([]);
    };

    // Validate form before submission
    const validateForm = () => {
        const errors = [];
        if (!newWort.trim()) errors.push('Wort ist erforderlich');
        if (!newRedewendung.trim()) errors.push('Redewendung ist erforderlich');
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

    // Add new redewendung
    const addRedewendung = async () => {
        if (!validateForm()) return;

        try {
            const response = await fetch('/api/redewendung', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Wort: newWort,
                    Redewendung: newRedewendung,
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
            setMessage("Redewendung erfolgreich hinzugefügt!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error adding redewendung:", error);
            setMessage(`Fehler beim Hinzufügen der Redewendung: ${error.message}`);
            setMessageType("error");
            setTimeout(() => {
                setMessage("");
            }, 10000);
        }
    };

    // Update existing redewendung
    const updateRedewendung = async () => {
        if (!validateForm()) return;

        try {
            const response = await fetch('/api/redewendung', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    Wort: newWort,
                    Redewendung: newRedewendung,
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
            setMessage("Redewendung erfolgreich aktualisiert!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error updating redewendung:", error);
            setMessage(`Fehler beim Aktualisieren der Redewendung: ${error.message}`);
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
                    
                    {/* Suchfeld für bestehende Redewendungen */}
                    <div className="mb-8 relative">
                        <FormField
                            id="search"
                            label="Redewendung zum Bearbeiten suchen:"
                            helpText="Geben Sie den Anfang einer Redewendung ein, um sie zu finden"
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
                            displayField="Redewendung"
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
                                    placeholder="z.B. Kopf"
                                />
                            </FormField>
                            <FormField id="redewendung" label="Redewendung:" className="mb-4">
                                <TextField
                                    id="redewendung"
                                    value={newRedewendung}
                                    onChange={(e) => setNewRedewendung(e.target.value)}
                                    placeholder="z.B. Den Kopf in den Sand stecken."
                                />
                            </FormField>
                            <FormField id="erklaerung" label="Erklärung:" className="mb-4">
                                <TextField
                                    id="erklaerung"
                                    value={newErklaerung}
                                    onChange={(e) => setNewErklaerung(e.target.value)}
                                    placeholder="z.B. Probleme ignorieren."
                                />
                            </FormField>
                        </div>
                        <div>
                            <FormField id="beispiel" label="Beispiel:" className="mb-4">
                                <TextField
                                    id="beispiel"
                                    value={newBeispiel}
                                    onChange={(e) => setNewBeispiel(e.target.value)}
                                    placeholder="z.B. Er steckt den Kopf in den Sand."
                                />
                            </FormField>
                            <FormField id="quelle" label="Quelle:" className="mb-4">
                                <TextField
                                    id="quelle"
                                    value={newQuelle}
                                    onChange={(e) => setNewQuelle(e.target.value)}
                                    placeholder="z.B. Redensart"
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
                            onClick={id ? updateRedewendung : addRedewendung}
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