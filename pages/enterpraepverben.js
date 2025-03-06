import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getPraepverben } from "../prisma/praepverben";

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
        const praepverbenRaw = await getPraepverben() || [];
        const formattedPraepverben = praepverbenRaw.map(item => ({
            ...item,
            Datum: item.Datum instanceof Date ? item.Datum.toISOString() : item.Datum
        }));
        return {
            props: {
                praepverben: formattedPraepverben
            }
        };
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return {
            props: {
                praepverben: [],
                error: 'Failed to load data'
            }
        };
    }
}

export default function Praepverben({ praepverben }) {
    const { data: session } = useSession();
    const router = useRouter();
    
    // Form state
    const [id, setId] = useState("");
    const [newSatz, setNewSatz] = useState("");
    const [newVerb, setNewVerb] = useState("");
    const [newErklaerung, setNewErklaerung] = useState("");
    const [newBeispiele, setNewBeispiele] = useState("");
    const [newLoesung, setNewLoesung] = useState("");
    const [newQuelle, setNewQuelle] = useState("");
    const [newDatum, setNewDatum] = useState("");
    
    // UI state
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [suggestions, setSuggestions] = useState([]);
    const [searchInput, setSearchInput] = useState("");

    // Update suggestions with guard clause
    const updateSuggestions = (inputValue) => {
        if (!Array.isArray(praepverben)) {
            setSuggestions([]);
            return;
        }
        const filteredResults = praepverben.filter((item) =>
            item?.Satz?.toLowerCase().includes(inputValue.toLowerCase())
        );
        setSuggestions(filteredResults);
    };

    const refreshPage = () => {
        router.replace(router.asPath, undefined, { scroll: false });
    };

    // Reset form fields
    const resetForm = () => {
        setId('');
        setNewSatz('');
        setNewVerb('');
        setNewErklaerung('');
        setNewBeispiele('');
        setNewLoesung('');
        setNewQuelle('');
        setNewDatum('');
        setSearchInput('');
        setSuggestions([]);
    };

    // Set form with data from selected item
    const setForm = (item) => {
        if (!item) return;
        
        setId(item.id || '');
        setNewSatz(item.Satz || '');
        setNewVerb(item.Verb || '');
        setNewErklaerung(item.Erklaerung || '');
        setNewBeispiele(item.Beispiele || '');
        setNewLoesung(item.Loesung || '');
        setNewQuelle(item.quelle || '');
        setNewDatum(item.Datum ? new Date(item.Datum).toISOString().split('T')[0] : '');
    };

    // Handle search focus
    const handleSearchFocus = () => {
        if (Array.isArray(praepverben)) {
            setSuggestions(praepverben);
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
        setSearchInput(item.Satz);
        setSuggestions([]);
    };

    // Validate form before submission
    const validateForm = () => {
        const errors = [];
        if (!newSatz.trim()) errors.push('Satz ist erforderlich');
        if (!newVerb.trim()) errors.push('Verb ist erforderlich');
        if (!newErklaerung.trim()) errors.push('Erklärung ist erforderlich');
        if (!newBeispiele.trim()) errors.push('Beispiele sind erforderlich');
        if (!newLoesung.trim()) errors.push('Lösung ist erforderlich');
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

    // Add new praepverben
    const addPraepverben = async () => {
        if (!validateForm()) return;

        try {
            const response = await fetch('/api/praepverben', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Satz: newSatz,
                    Verb: newVerb,
                    Erklaerung: newErklaerung,
                    Beispiele: newBeispiele,
                    Loesung: newLoesung,
                    quelle: newQuelle,
                    Datum: newDatum
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Speichern');
            }

            const data = await response.json();
            resetForm();
            setMessage("Präposition mit Verb erfolgreich hinzugefügt!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error adding praepverben:", error);
            setMessage(`Fehler beim Hinzufügen der Präposition mit Verb: ${error.message}`);
            setMessageType("error");
            setTimeout(() => {
                setMessage("");
            }, 10000);
        }
    };

    // Update existing praepverben
    const updatePraepverben = async () => {
        if (!validateForm()) return;

        try {
            const response = await fetch('/api/praepverben', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    Satz: newSatz,
                    Verb: newVerb,
                    Erklaerung: newErklaerung,
                    Beispiele: newBeispiele,
                    Loesung: newLoesung,
                    quelle: newQuelle,
                    Datum: newDatum
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Aktualisieren');
            }

            const data = await response.json();
            resetForm();
            setMessage("Präposition mit Verb erfolgreich aktualisiert!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error updating praepverben:", error);
            setMessage(`Fehler beim Aktualisieren der Präposition mit Verb: ${error.message}`);
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
                    
                    {/* Suchfeld für bestehende Präpositionen mit Verben */}
                    <div className="mb-8 relative">
                        <FormField
                            id="search"
                            label="Präposition mit Verb zum Bearbeiten suchen:"
                            helpText="Geben Sie den Anfang eines Satzes ein, um ihn zu finden"
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
                            displayField="Satz"
                        />
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <FormField id="satz" label="Satz:" className="mb-4">
                                <TextField
                                    id="satz"
                                    value={newSatz}
                                    onChange={(e) => setNewSatz(e.target.value)}
                                    placeholder="z.B. Ich freue mich ___ den Urlaub."
                                />
                            </FormField>
                            <FormField id="verb" label="Verb:" className="mb-4">
                                <TextField
                                    id="verb"
                                    value={newVerb}
                                    onChange={(e) => setNewVerb(e.target.value)}
                                    placeholder="z.B. freuen"
                                />
                            </FormField>
                            <FormField id="erklaerung" label="Erklärung:" className="mb-4">
                                <TextField
                                    id="erklaerung"
                                    value={newErklaerung}
                                    onChange={(e) => setNewErklaerung(e.target.value)}
                                    placeholder="z.B. Freude ausdrücken"
                                />
                            </FormField>
                        </div>
                        <div>
                            <FormField id="beispiele" label="Beispiele:" className="mb-4">
                                <TextField
                                    id="beispiele"
                                    value={newBeispiele}
                                    onChange={(e) => setNewBeispiele(e.target.value)}
                                    placeholder="z.B. Sie freut sich auf die Reise."
                                />
                            </FormField>
                            <FormField id="loesung" label="Lösung:" className="mb-4">
                                <TextField
                                    id="loesung"
                                    value={newLoesung}
                                    onChange={(e) => setNewLoesung(e.target.value)}
                                    placeholder="z.B. auf"
                                />
                            </FormField>
                            <FormField id="quelle" label="Quelle:" className="mb-4">
                                <TextField
                                    id="quelle"
                                    value={newQuelle}
                                    onChange={(e) => setNewQuelle(e.target.value)}
                                    placeholder="z.B. Lehrbuch Seite 42"
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
                            onClick={id ? updatePraepverben : addPraepverben}
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