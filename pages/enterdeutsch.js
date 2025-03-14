import { useState } from "react";
import { useSession } from "next-auth/react";
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { getDeutsch } from "../prisma/deutsch";

// Modern UI components
import { X, PlusCircle, Send, Save, Search } from 'lucide-react';
import FormField from '@/components/WordGarden/FormField';
import TextField from '@/components/WordGarden/TextField';
import Button from '@/components/WordGarden/Button';
import RadioGroup from '@/components/WordGarden/RadioGroup';
import CheckboxGroup from '@/components/WordGarden/CheckboxGroup';
import SuggestionList from '@/components/WordGarden/SuggestionList';
import DynamicFieldArray from '@/components/WordGarden/DynamicFieldArray';
import EntryPage from '@/components/layout/EntryPage';

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
        const deutschRaw = await getDeutsch() || []; // Fallback auf leeres Array
        const formattedDeutsch = deutschRaw.map(document => ({
            ...document,
            DateEntryWord: document.DateEntryWord instanceof Date 
                ? document.DateEntryWord.toISOString() 
                : document.DateEntryWord,
            Article: Array.isArray(document.Article) ? document.Article.map(article => ({
                ...article,
                DateSource: article.DateSource instanceof Date 
                    ? article.DateSource.toISOString() 
                    : article.DateSource
            })) : []
        }));

        return {
            props: {
                deutsch: formattedDeutsch
            }
        };
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return {
            props: {
                deutsch: [],
                error: 'Failed to load data'
            }
        };
    }
}

export default function Deutsch({ deutsch }) {
    const { data: session } = useSession();
    const router = useRouter();
    
    // Form state
    const [newArtikel, setNewArtikel] = useState("");
    const [id, setId] = useState("");
    const [newDefinition, setNewDefinition] = useState("");
    const [newPrefix, setNewPrefix] = useState("");
    const [newStructure, setNewStructure] = useState("");
    const [newTypeOfWord, setNewTypeOfWord] = useState([]);
    const [newWord, setNewWord] = useState("");
    const [newRoot, setNewRoot] = useState("");
    
    // UI state
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");
    const [suggestions, setSuggestions] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    
    // Dynamic fields state
    const [translations, setTranslations] = useState([{ Transl_F: '' }]);
    const [articles, setArticles] = useState([{ TitleOfArticle: '', Sentence_D: '', Source: '', DateSource: '' }]);

    // Word type options for checkbox group
    const wordTypes = [
        { id: 'Adjektiv', value: 'Adjektiv', label: 'Adjektiv' },
        { id: 'Adverb', value: 'Adverb', label: 'Adverb' },
        { id: 'Ausdruck', value: 'Ausdruck', label: 'Ausdruck' },
        { id: 'Konjunktion', value: 'Konjunktion', label: 'Konjunktion' },
        { id: 'Nomen', value: 'Nomen', label: 'Nomen' },
        { id: 'Partizip', value: 'Partizip', label: 'Partizip' },
        { id: 'Präposition', value: 'Präposition', label: 'Präposition' },
        { id: 'Pronomen', value: 'Pronomen', label: 'Pronomen' },
        { id: 'IntransitivesVerb', value: 'Intransitives Verb', label: 'Verb (Intransitiv)' },
        { id: 'ReflexivesVerb', value: 'Reflexives Verb', label: 'Verb (Reflexiv)' },
        { id: 'TransitivesVerb', value: 'Transitives Verb', label: 'Verb (Transitiv)' },
        { id: 'UnpersönlichesVerb', value: 'Unpersönliches Verb', label: 'Verb (Unpersönlich)' }
    ];

    // Artikel options for radio group
    const artikelOptions = [
        { id: 'keiner', value: '', label: 'Keiner' },
        { id: 'der', value: 'der', label: 'der' },
        { id: 'die', value: 'die', label: 'die' },
        { id: 'das', value: 'das', label: 'das' }
    ];

    // Update suggestions with guard clause
    const updateSuggestions = (inputValue) => {
        if (!Array.isArray(deutsch)) {
            setSuggestions([]);
            return;
        }
        const filteredResults = deutsch.filter((item) =>
            item?.Word?.toLowerCase().includes(inputValue.toLowerCase())
        );
        setSuggestions(filteredResults);
    };

    const refreshPage = () => {
        router.replace(router.asPath, undefined, { scroll: false });
    };

    // Handle word type checkbox changes
    const handleWordTypeChange = (value, checked) => {
        if (checked) {
            setNewTypeOfWord(prevTypes => {
                if (prevTypes.some(type => type.TypeOfWord === value)) {
                    return prevTypes;
                }
                return [...prevTypes, { TypeOfWord: value }];
            });
        } else {
            setNewTypeOfWord(prevTypes => prevTypes.filter(type => type.TypeOfWord !== value));
        }
    };

    // Handle translation field changes
    const handleTranslationChange = (index, value) => {
        setTranslations((prevTranslations) => {
            const updatedTranslations = [...prevTranslations];
            updatedTranslations[index] = { Transl_F: value };
            return updatedTranslations;
        });
    };

    const handleAddTranslation = () => {
        setTranslations((prevTranslations) => [...prevTranslations, { Transl_F: '' }]);
    };

    const handleRemoveTranslation = (index) => {
        if (translations.length > 1) {
            setTranslations((prevTranslations) => {
                const updatedTranslations = [...prevTranslations];
                updatedTranslations.splice(index, 1);
                return updatedTranslations;
            });
        }
    };

    // Handle article field changes
    const handleArticleFieldChange = (index, field, value) => {
        setArticles((prevArticles) => {
            const updatedArticles = [...prevArticles];
            updatedArticles[index][field] = value;
            return updatedArticles;
        });
    };

    const handleAddArticle = () => {
        setArticles((prevArticles) => [...prevArticles, { TitleOfArticle: '', Sentence_D: '', Source: '', DateSource: '' }]);
    };

    const handleRemoveArticle = (index) => {
        if (articles.length > 1) {
            setArticles((prevArticles) => {
                const updatedArticles = [...prevArticles];
                updatedArticles.splice(index, 1);
                return updatedArticles;
            });
        }
    };

    // Reset form fields
    const resetForm = () => {
        setId('');
        setNewWord('');
        setNewPrefix('');
        setNewRoot('');
        setNewStructure('');
        setNewDefinition('');
        setNewArtikel('');
        setNewTypeOfWord([]);
        setTranslations([{ Transl_F: '' }]);
        setArticles([{ TitleOfArticle: '', Sentence_D: '', Source: '', DateSource: '' }]);
        setSearchInput('');
        setSuggestions([]);
    };

    // Set form with data from selected item
    const setForm = (item) => {
        if (!item) return;
        
        setId(item.id || '');
        setNewWord(item.Word || '');
        setNewPrefix(item.Prefix || '');
        setNewRoot(item.Root || '');
        setNewStructure(item.Structure || '');
        setNewDefinition(item.Definition || '');
        setNewArtikel(item.Artikel || '');
        
        if (Array.isArray(item.TypeOfWord)) {
            setNewTypeOfWord(item.TypeOfWord);
        } else {
            setNewTypeOfWord([]);
        }
        
        if (Array.isArray(item.Transl_F) && item.Transl_F.length > 0) {
            setTranslations(item.Transl_F);
        } else {
            setTranslations([{ Transl_F: '' }]);
        }
        
        if (Array.isArray(item.Article) && item.Article.length > 0) {
            setArticles(item.Article);
        } else {
            setArticles([{ TitleOfArticle: '', Sentence_D: '', Source: '', DateSource: '' }]);
        }
    };

    // Handle search focus
    const handleSearchFocus = () => {
        if (Array.isArray(deutsch)) {
            setSuggestions(deutsch);
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
        setSearchInput(item.Word);
        setSuggestions([]);
    };

    // Validate form before submission
    const validateForm = () => {
        const errors = [];
        if (!newWord.trim()) errors.push('Wort ist erforderlich');
        if (newTypeOfWord.length === 0) errors.push('Mindestens eine Wortart muss ausgewählt werden');
        
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

    // Add new word
    const addDeutsch = async () => {
        if (!validateForm()) return;

        try {
            const updatedArticles = articles.map((article) => ({
                ...article,
                DateSource: article.DateSource ? new Date(article.DateSource) : new Date(),
                TitleOfArticle: article.TitleOfArticle || "",
                Sentence_D: article.Sentence_D || "",
                Source: article.Source || ""
            }));
            
            await fetch('/api/deutsch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Artikel: newArtikel || "",
                    Word: newWord,
                    Prefix: newPrefix || "",
                    Root: newRoot || "",
                    Structure: newStructure || "",
                    TypeOfWord: newTypeOfWord,
                    Definition: newDefinition || "",
                    Transl_F: translations.map(t => ({ Transl_F: t.Transl_F || "" })),
                    Article: updatedArticles,
                })
            }).then(res => res.json());
            
            resetForm();
            setMessage("Wort erfolgreich hinzugefügt!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error adding word:", error);
            setMessage("Fehler beim Hinzufügen des Wortes");
            setMessageType("error");
        }
    };

    // Update existing word
    const updateDeutsch = async () => {
        if (!validateForm()) return;

        try {
            const updatedArticles = articles.map((article) => ({
                ...article,
                DateSource: new Date(article.DateSource),
            }));
            
            await fetch('/api/deutsch', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    Artikel: newArtikel,
                    Word: newWord,
                    Prefix: newPrefix,
                    Root: newRoot,
                    Structure: newStructure,
                    TypeOfWord: newTypeOfWord,
                    Definition: newDefinition,
                    Transl_F: translations,
                    Article: updatedArticles,
                })
            }).then(res => res.json());
            
            resetForm();
            setMessage("Wort erfolgreich aktualisiert!");
            setMessageType("success");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage();
        } catch (error) {
            console.error("Error updating word:", error);
            setMessage("Fehler beim Aktualisieren des Wortes");
            setMessageType("error");
        }
    };

    return (
        <EntryPage
            title="Deutsch Worterfassung"
            message={message}
            messageType={messageType}
            setMessage={setMessage}
        >
            {/* Form Content */}
            <div>
                {/* Suchfeld für bestehende Wörter */}
                    <div className="mb-8 relative">
                        <FormField
                            id="search"
                            label="Wort zum Bearbeiten suchen:"
                            helpText="Geben Sie den Anfang eines Wortes ein, um es zu finden"
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
                        />
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Linke Spalte */}
                        <div>
                            <FormField id="word" label="Wort:" className="mb-4">
                                <TextField
                                    id="word"
                                    value={newWord}
                                    onChange={(e) => setNewWord(e.target.value)}
                                    placeholder="z.B. laufen"
                                />
                            </FormField>
                            <FormField id="prefix" label="Präfix:" className="mb-4">
                                <TextField
                                    id="prefix"
                                    value={newPrefix}
                                    onChange={(e) => setNewPrefix(e.target.value)}
                                    placeholder="z.B. ab-"
                                />
                            </FormField>
                            <FormField id="root" label="Stamm:" className="mb-4">
                                <TextField
                                    id="root"
                                    value={newRoot}
                                    onChange={(e) => setNewRoot(e.target.value)}
                                    placeholder="z.B. lauf"
                                />
                            </FormField>
                            <FormField id="structure" label="Struktur:" className="mb-4">
                                <TextField
                                    id="structure"
                                    value={newStructure}
                                    onChange={(e) => setNewStructure(e.target.value)}
                                    placeholder="z.B. ab-lauf-en"
                                />
                            </FormField>
                            <FormField id="definition" label="Definition:" className="mb-6">
                                <TextField
                                    id="definition"
                                    value={newDefinition}
                                    onChange={(e) => setNewDefinition(e.target.value)}
                                    placeholder="Beschreibung der Wortbedeutung"
                                />
                            </FormField>

                            {/* Translations Section */}
                            <div className="mb-8 bg-wg-neutral-50 p-4 rounded-lg border border-wg-neutral-200">
                                <DynamicFieldArray
                                    title="Französische Übersetzungen"
                                    items={translations}
                                    onAdd={handleAddTranslation}
                                    onRemove={handleRemoveTranslation}
                                    renderItem={(item, index) => (
                                        <TextField
                                            id={`translation_${index}`}
                                            value={item.Transl_F}
                                            onChange={(e) => handleTranslationChange(index, e.target.value)}
                                            placeholder="Französische Übersetzung"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Rechte Spalte */}
                        <div>
                            <FormField id="artikel" label="Artikel:" className="mb-6">
                                <RadioGroup
                                    name="artikel"
                                    options={artikelOptions}
                                    selectedValue={newArtikel}
                                    onChange={setNewArtikel}
                                    inline
                                />
                            </FormField>
                            <FormField id="wortart" label="Wortart:" className="mb-6">
                                <CheckboxGroup
                                    options={wordTypes}
                                    selectedValues={newTypeOfWord.map(type => type.TypeOfWord)}
                                    onChange={handleWordTypeChange}
                                    columns={2}
                                />
                            </FormField>

                            {/* Articles/Examples Section */}
                            <div className="bg-wg-neutral-50 p-4 rounded-lg border border-wg-neutral-200">
                                <DynamicFieldArray
                                    title="Beispiele"
                                    items={articles}
                                    onAdd={handleAddArticle}
                                    onRemove={handleRemoveArticle}
                                    renderItem={(item, index) => (
                                        <div className="space-y-3">
                                            <TextField
                                                id={`title_${index}`}
                                                value={item.TitleOfArticle}
                                                onChange={(e) => handleArticleFieldChange(index, 'TitleOfArticle', e.target.value)}
                                                placeholder="Titel"
                                            />
                                            <TextField
                                                id={`sentence_${index}`}
                                                value={item.Sentence_D}
                                                onChange={(e) => handleArticleFieldChange(index, 'Sentence_D', e.target.value)}
                                                placeholder="Beispielsatz"
                                            />
                                            <TextField
                                                id={`source_${index}`}
                                                value={item.Source}
                                                onChange={(e) => handleArticleFieldChange(index, 'Source', e.target.value)}
                                                placeholder="Quelle"
                                            />
                                            <TextField
                                                id={`date_${index}`}
                                                type="date"
                                                value={item.DateSource}
                                                onChange={(e) => handleArticleFieldChange(index, 'DateSource', e.target.value)}
                                                placeholder="Datum"
                                            />
                                        </div>
                                    )}
                                />
                            </div>
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
                            onClick={id ? updateDeutsch : addDeutsch}
                            icon={id ? <Save size={18} /> : <Send size={18} />}
                            className="w-40"
                        >
                            {id ? 'Aktualisieren' : 'Speichern'}
                        </Button>
                    </div>
            </div>
        </EntryPage>
    );
}
