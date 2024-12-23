import { getDeutschCount } from "../prisma/deutsch";
import { getDeutsch } from "../prisma/deutsch";
import { useSession, signOut } from "next-auth/react"
import Link from 'next/link';
import { debounce } from 'lodash';
import Image from 'next/image'
import { useState, useEffect } from "react"
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Message from "./Message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faArrowLeft, faTrashRestore, faPaperPlane, faPlus, faFilter } from "@fortawesome/free-solid-svg-icons";
import Head from 'next/head';
import {
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
  } from "@material-tailwind/react";

export async function getServerSideProps(context) {
    const session = await getSession(context);
    const { query } = context;

    const searchInput = query.searchInput || '';
    const radioInput = query.radioInput || '';
    const isRootSearch = query.isRootSearch === 'true'; // Hinzugefügt
    if (session) {
        const deutsch = await getDeutsch();

        const { query } = context;

        const searchInput = query.searchInput || '';
        const radioInput = query.radioInput || '';

        deutsch.forEach(document => {
            document.Article.forEach(article => {
                if (article.DateSource !== null && article.DateSource instanceof Date) {
                    article.DateSource = article.DateSource.toISOString();
                }
            });
        });

        deutsch.forEach(document => {
            if (document.DateEntryWord instanceof Date) {
                document.DateEntryWord = document.DateEntryWord.toISOString();
            }
        });

        const kategorie = 'deutsch'

        const res = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}&kategorie=${encodeURIComponent(kategorie)}`);
        const standingSums = await res.json();

        standingSums.trainedSum = standingSums.trainedSum ? standingSums.trainedSum : 0;
        standingSums.alltimeSum = standingSums.alltimeSum ? standingSums.alltimeSum : 0;

        const deutschCount = await getDeutschCount();

        const res2 = await fetch(`http://localhost:3000/api/standing?user=${encodeURIComponent(session.user.email)}`);
        const finished = await res2.json();

        const filteredDeutsch = deutsch.filter((deutschObj) => {
            return !finished.some((finishedObj) => {
                return finishedObj.exercise === deutschObj.id;
            });
        }).filter((deutschObj) => {
            if (searchInput !== '') {
                if (isRootSearch && deutschObj.Root) {
                    return deutschObj.Root.toLowerCase().includes(searchInput.toLowerCase());
                } else if (deutschObj.Word) {
                    return deutschObj.Word.toLowerCase().includes(searchInput.toLowerCase());
                }
            } else if (radioInput !== '' && deutschObj.TypeOfWord) {
                return deutschObj.TypeOfWord.some(obj => obj.TypeOfWord === radioInput);
            }
            return true;
        });
        

        const summary = standingSums.summary.map((standing) => {
            const matchingDeutsch = deutsch.find((deutschObj) => {
                return standing.exercise === deutschObj.id;
            });

            if (matchingDeutsch) {
                const date = new Date(matchingDeutsch.DateEntryWord);
                const formattedDate = date.toLocaleDateString();
                matchingDeutsch.DateEntryWord = formattedDate;

                return {
                    summary: matchingDeutsch
                };
            } else {
                return {
                    summary: null
                };
            }
        });
        if (filteredDeutsch.length === 0) {
            return {
                redirect: {
                    destination: "/successDeutsch",
                    permanent: false,
                },
            };
        } else {
            const randomIndex = Math.floor(Math.random() * filteredDeutsch.length);
            const randomDeutsch = filteredDeutsch[randomIndex];

            const date = new Date(randomDeutsch.DateEntryWord);
            const formattedDate = date.toLocaleDateString();
            randomDeutsch.DateEntryWord = formattedDate
            return {
                props: {
                    deutschCount,
                    deutsch: randomDeutsch,
                    standingSums,
                    summary,
                    filteredDeutsch
                }
            }
        }
    } else {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }
}

export default function Deutsch({ deutschCount, deutsch, standingSums, summary, filteredDeutsch }) {

    const { data: session } = useSession()
    const debouncedHandleClick = debounce((callback) => callback(), 500);
    const [standingExists, setStanding] = useState({})
    const [OKTrigger, setOKTrigger] = useState(0);
    const [NOKTrigger, setNOKTrigger] = useState(0);
    const router = useRouter();
    const [newArtikel, setNewArtikel] = useState("");
    const [newDefinition, setNewDefinition] = useState("");
    const [newPrefix, setNewPrefix] = useState("");
    const [newStructure, setNewStructure] = useState("");
    const [newTransl_F, setNewTransl_F] = useState("");
    const [newTypeOfWord, setNewTypeOfWord] = useState([]);
    const [newTitleOfArticle, setNewTitleOfArticle] = useState("");
    const [newSentence, setNewSentence] = useState("");
    const [newSource, setNewSource] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newWord, setNewWord] = useState("");
    const [newRoot, setNewRoot] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [newTypeOfWordFilter, setNewTypeOfWordFilter] = useState("");
    const [isRootSearch, setIsRootSearch] = useState(false);


    const [open, setOpen] = useState(false);
 
    const handleOpen = () => setOpen(!open);

    console.log(summary)

    const handleSuggestionClick = (suggestion) => {
        const cleanedSuggestion = suggestion.replace(/\s+\(\d+\)$/, '');
        setSearchInput(cleanedSuggestion);
        updateSuggestions(cleanedSuggestion);
    };


    const updateRootSuggestions = (inputValue) => {
        if (filteredDeutsch && filteredDeutsch.length > 0) {
            // Zähle die Duplikate basierend auf dem Root-Feld
            const validData = filteredDeutsch.filter(item => {
                return item.hasOwnProperty('Root') && item.Root !== null && item.Root !== undefined && item.Root.trim() !== "";
            });            
            
            const duplicatesCount = validData.reduce((countMap, item) => {
                const root = item?.Root;
                if (root.toLowerCase().includes(inputValue.toLowerCase())) {
                    countMap[root] = (countMap[root] || 0) + 1;
                }
                return countMap;
            }, {});
    
            // Erstelle die Vorschlagsliste
            const filteredResults = Object.keys(duplicatesCount)
            .filter(root => root && root.trim() !== "")
            .map((root) => ({
                Word: `${root} (${duplicatesCount[root]})`, // Anzeige wie in der globalen Suche
            }));
    
            setSuggestions(filteredResults); // Setze die Vorschläge
        } else {
            setSuggestions([]); // Keine Ergebnisse, leere Vorschläge
        }
    };
    
    const updateSuggestions = (inputValue) => {
        if (filteredDeutsch && filteredDeutsch.length > 0) {
            const key = isRootSearch ? "Root" : "Word";
            const duplicatesCount = filteredDeutsch.reduce((countMap, item) => {
                const value = item?.[key];
                if (value && value.toLowerCase().includes(inputValue.toLowerCase())) {
                    countMap[value] = (countMap[value] || 0) + 1;
                }
                return countMap;
            }, {});
    
            const filteredResults = Object.keys(duplicatesCount).map((value) => ({
                Word: `${value} (${duplicatesCount[value]})`,
            }));
    
            setSuggestions(filteredResults);
        } else {
            setSuggestions([]);
        }
    };
    
    

    const handleFocus = () => {
        if (searchInput) {
            setSuggestions(filteredSuggestions);
        } else if (isRootSearch) {
            // Nur Vorschläge basierend auf Root anzeigen
            const duplicatesCount = filteredDeutsch.reduce((countMap, item) => {
                const root = item?.Root;
                if (root) {
                    countMap[root] = (countMap[root] || 0) + 1;
                }
                return countMap;
            }, {});
    
            const filteredResults = Object.keys(duplicatesCount).map((root) => ({
                Word: `${root} (${duplicatesCount[root]})`,
            }));
    
            setSuggestions(filteredResults);
        } else {
            // Standard: Vorschläge basierend auf Word anzeigen
            const duplicatesCount = filteredDeutsch.reduce((countMap, item) => {
                const word = item?.Word;
                if (word) {
                    countMap[word] = (countMap[word] || 0) + 1;
                }
                return countMap;
            }, {});
    
            const filteredResults = Object.keys(duplicatesCount).map((word) => ({
                Word: `${word} (${duplicatesCount[word]})`,
            }));
    
            setSuggestions(filteredResults);
        }
    };
    
    
    const handleRootSearchToggle = (e) => {
        const isChecked = e.target.checked;
        setIsRootSearch(isChecked); // Setze den Zustand
    };
    

    const handleBlur = () => {
        setTimeout(() => {
            setSuggestions([]);
        }, 200);
    };

    const handleSearchChange = (e) => {
        const inputValue = e.target.value;
        setSearchInput(inputValue);
        updateSuggestions(inputValue);
    };

    const handleFilterClick = () => {
        console.log(searchInput)
        if (searchInput !== '') {
            router.replace(
                `/deutsch?searchInput=${encodeURIComponent(searchInput)}`,
                undefined,
                { scroll: false }
            );
        } else if (newTypeOfWordFilter !== '') {
            router.replace(
                `/deutsch?radioInput=${encodeURIComponent(newTypeOfWordFilter)}`,
                undefined,
                { scroll: false }
            );
        }
    };
    
    

    const handleRemoveFilter = () => {
        setTimeout(() => {
            setSearchInput('');
            setNewTypeOfWordFilter('')
            setIsRootSearch(false)
            setErrorMessage('')
            document.getElementById("UnpersönlichesVerbFilter").checked = false;
            document.getElementById("TransitivesVerbFilter").checked = false;
            document.getElementById("IntransitivesVerbFilter").checked = false;
            document.getElementById("ReflexivesVerbFilter").checked = false;
            document.getElementById("PräpositionFilter").checked = false;
            document.getElementById("PartizipFilter").checked = false;
            document.getElementById("NomenFilter").checked = false;
            document.getElementById("KonjunktionFilter").checked = false;
            document.getElementById("AusdruckFilter").checked = false;
            document.getElementById("AdverbFilter").checked = false;
            document.getElementById("AdjektivFilter").checked = false;
            document.getElementById("RootSearchFilter").checked = false;
        }, 50);
        router.replace(
            `/deutsch`,
            undefined,
            { scroll: false }
        );
    };

    useEffect(() => {
        const navigationEntries = performance.getEntriesByType("navigation");
        if (navigationEntries.length > 0 && navigationEntries[0].type === "reload") {
            setTimeout(() => {
                setSearchInput('');
                setNewTypeOfWordFilter('')
                setErrorMessage('')
                document.getElementById("UnpersönlichesVerbFilter").checked = false;
                document.getElementById("TransitivesVerbFilter").checked = false;
                document.getElementById("IntransitivesVerbFilter").checked = false;
                document.getElementById("ReflexivesVerbFilter").checked = false;
                document.getElementById("PräpositionFilter").checked = false;
                document.getElementById("PartizipFilter").checked = false;
                document.getElementById("NomenFilter").checked = false;
                document.getElementById("KonjunktionFilter").checked = false;
                document.getElementById("AusdruckFilter").checked = false;
                document.getElementById("AdverbFilter").checked = false;
                document.getElementById("AdjektivFilter").checked = false;
            }, 50);
            router.replace(
                `/deutsch`,
                undefined,
                { scroll: false }
            );
        }
    }, [isRootSearch]);

    useEffect(() => {
        if (newTypeOfWordFilter !== '') {
            setErrorMessage('')
        }
    }, [newTypeOfWordFilter]);

    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', (event) => {
            if (!event.persisted) {
                if (session) {
                    const standingIN = session.user.email;
                    const button = "trained";
                    fetch('/api/standing', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ standingIN, button })
                    })
                        .then(response => response.json())
                        .then(data => console.log(data))
                        .catch(error => console.error(error));
                }
            }
        });
    }

    const refreshPage = () => {
        router.replace(router.asPath, undefined, { scroll: false });
    };

    const handleOK = async () => {
        const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(deutsch.id)}`)
        const data = await response.json()
        setStanding(data)
        setOKTrigger(prevTrigger => prevTrigger + 1)
    };


    
    useEffect(() => {
        if (OKTrigger > 0) {
            if (standingExists == null) {
                const user = session.user.email;
                const exercise = deutsch.id;
                const kategorie = 'deutsch'
                const button = 'OK';
                fetch('/api/standing', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user, exercise, button, kategorie })
                })
                    .then(response => response.json())
                    .then(data => console.log(data))
                    .catch(error => console.error(error));
            } else {
                const standingIN = standingExists.id;
                const button = "OK";
                fetch('/api/standing', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ standingIN, button })
                })
                    .then(response => response.json())
                    .then(data => console.log(data))
                    .catch(error => console.error(error));
            }
            refreshPage();
        }
    }, [OKTrigger]);

    const handleNOK = async () => {
        const response = await fetch(`/api/standing?user=${encodeURIComponent(session.user.email)}&exercise=${encodeURIComponent(deutsch.id)}`)
        const data = await response.json()
        setStanding(data)
        setNOKTrigger(prevTrigger => prevTrigger + 1)
    };

    useEffect(() => {
        if (router.query.redirected === 'true') {
            setSearchInput('');
            setErrorMessage('Der Filter wurde automatisch zurückgesetzt, da jede Bedeutung des gefilterten Wortes bzw. die gefilterte Wortart vollständig erlernt wurde!')
            setNewTypeOfWordFilter('')
            document.getElementById("UnpersönlichesVerbFilter").checked = false;
            document.getElementById("TransitivesVerbFilter").checked = false;
            document.getElementById("IntransitivesVerbFilter").checked = false;
            document.getElementById("ReflexivesVerbFilter").checked = false;
            document.getElementById("PräpositionFilter").checked = false;
            document.getElementById("PartizipFilter").checked = false;
            document.getElementById("NomenFilter").checked = false;
            document.getElementById("KonjunktionFilter").checked = false;
            document.getElementById("AusdruckFilter").checked = false;
            document.getElementById("AdverbFilter").checked = false;
            document.getElementById("AdjektivFilter").checked = false;
            router.replace(
                `/deutsch`,
                undefined,
                { scroll: false }
            );
            const urlWithoutQuery = window.location.href.split('?')[0];
            window.history.replaceState(null, null, urlWithoutQuery);
        }
    }, [router.query.redirected]);

    useEffect(() => {
        if (NOKTrigger > 0) {
            if (standingExists == null) {
                const user = session.user.email;
                const exercise = deutsch.id;
                const kategorie = 'deutsch';
                const button = 'NOK';
                fetch('/api/standing', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user, exercise, button, kategorie })
                })
                    .then(response => response.json())
                    .then(data => console.log(data))
                    .catch(error => console.error(error));
            } else {
                const standingIN = standingExists.id;
                const button = "NOK";
                fetch('/api/standing', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ standingIN, button })
                })
                    .then(response => response.json())
                    .then(data => console.log(data))
                    .catch(error => console.error(error));
            }
            refreshPage();
        }
    }, [NOKTrigger]);

    const handleREV = async () => {
        const user = session.user.email;
        const kategorie = 'deutsch'
        fetch('/api/standing', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user, kategorie })
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(error => console.error(error));
        refreshPage()
    };


    const handleCheckboxChange = (event, value) => {
        const isChecked = event.target.checked;
        if (isChecked) {
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

    const [translations, setTranslations] = useState([{ Transl_F: '' }]);

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
        setTranslations((prevTranslations) => {
            const updatedTranslations = [...prevTranslations];
            updatedTranslations.splice(index, 1);
            return updatedTranslations;
        });
    };

    const [articles, setArticles] = useState([{ TitleOfArticle: '', Sentence_D: '', Source: '', DateSource: '' }]);

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
        setArticles((prevArticles) => {
            const updatedArticles = [...prevArticles];
            updatedArticles.splice(index, 1);
            return updatedArticles;
        });
    };

    const addDeutsch = async () => {
        if (newArtikel === null || newDefinition === null || newDefinition === '' || newPrefix === null || newPrefix === '' || newStructure === null || newStructure === '' || translations.some((translation) => translation.Transl_F === '') ||
            articles.some((article) => article.TitleOfArticle === '') || articles.some((article) => article.Sentence_D === '') || articles.some((article) => article.Source === '') || articles.some((article) => article.DateSource === '') ||
            newTypeOfWord.length === 0 || newWord === null || newWord === '' || newRoot === null || newRoot === '') {
            setMessage("Fülle bitte alle Felder aus!");
            setTimeout(() => {
                setMessage("");
            }, 10000);
        } else {
            const updatedArticles = articles.map((article) => ({
                ...article,
                DateSource: new Date(article.DateSource),
            }));
            await fetch('/api/deutsch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
            })
                .then(res => res.json())
            resetForm();
            setMessage("Erfolgreich hinzugefügt!");
            setTimeout(() => {
                setMessage("");
            }, 10000);
            refreshPage()
        }
    }

    const resetForm = () => {
        setTranslations([{ Transl_F: '' }]);
        setArticles([{ TitleOfArticle: '', Sentence_D: '', Source: '', DateSource: '' }]);
        setNewArtikel('');
        setNewWord('');
        setNewPrefix('');
        setNewRoot('');
        setNewStructure('');
        setNewTypeOfWord([]);
        setNewDefinition('');
        setNewTransl_F('');
        setNewTitleOfArticle('');
        setNewSentence('');
        setNewSource('');
        setNewDate('');
        document.getElementById("keiner").checked = false;
        document.getElementById("der").checked = false;
        document.getElementById("die").checked = false;
        document.getElementById("das").checked = false;
        document.getElementById("Konjunktion").checked = false;
        document.getElementById("IntransitivesVerb").checked = false;
        document.getElementById("ReflexivesVerb").checked = false;
        document.getElementById("Adjektiv").checked = false;
        document.getElementById("Ausdruck").checked = false;
        document.getElementById("TransitivesVerb").checked = false;
        document.getElementById("Adverb").checked = false;
        document.getElementById("Präposition").checked = false;
        document.getElementById("Nomen").checked = false;
        document.getElementById("Partizip").checked = false;
        document.getElementById("UnpersönlichesVerb").checked = false;
    }

    const Card = () => {
        const [showContent1, setShowContent1] = useState(true);

        const handleCardside = () => {
            setShowContent1(!showContent1);
        }
        
        const splitSentences = (text) => {
            // Entferne alle überflüssigen Zeichen, trenne nur an sinnvollen Stellen wie "." oder ";"
            const parts = text.split(';');
            return parts.flatMap(part => part.split(';')).map(s => s.trim()).filter(s => s.length > 0);
        }
        
        
        
        


        const Content1 = () => {
            return (
                <div className="h-144 bg-white rounded-lg p-4 shadow-lg relative flex items-center">
                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-pink-200 opacity-50 z-10"></div>
                    <div className="relative z-20 w-full max-w-full text-center">
                        <p className="text-2xl mb-2 mx-auto font-medium">{deutsch.Artikel}</p>
                        <p className="text-5xl mb-4 mx-auto font-bold">{deutsch.Word}</p>
                        <p className="text-3xl mb-8 mx-auto font-medium">{deutsch.Prefix} / {deutsch.Root}</p>
                        <div className="text-left mt-20">
                        <p className="text-2xl mx-auto mt-5">Stamm: {deutsch.Root}</p>
                        <p className="text-2xl mx-auto mt-5">Struktur: {deutsch.Structure}</p>
                            <p className="text-2xl mx-auto mt-5 ">Wortart:
                            {deutsch.TypeOfWord.map((typeofword, index) => (
                                    <span key={index}> {typeofword.TypeOfWord}</span>
                            ))}</p>
                            <p className="text-2xl mx-auto mt-5 font-semibold">Beispiele</p>
                            {deutsch.Article.map((article, index) => (

                                <div key={index} className="mb-2">
                                    {splitSentences(article.Sentence_D).map((sentence, sentenceindex) => (
                                        <p key={sentenceindex} className="mx-auto">
                                            <span className="bullet-point ml-1 mr-2"></span> {sentence}
                                        </p>
                                    ))}
<p className="text-sm mt-5 font-semibold">
  Quelle: {article.Source}
  {(article.TitleOfArticle || article.DateSource) && " ("}
  {article.TitleOfArticle ? `"${article.TitleOfArticle}"` : ""}
  {article.TitleOfArticle && article.DateSource ? ", " : ""}
  {article.DateSource ? new Date(article.DateSource).toLocaleDateString() : ""}
  {(article.TitleOfArticle || article.DateSource) && ")"}
</p>
                             </div>
                                

                            ))}

                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
                        <p className="text-sm">Hinzugefügt am: {deutsch.DateEntryWord}</p>
                    </div>
                </div>
            );
        }

        const Content2 = () => {
            return (
                <div className="h-144 bg-white rounded-lg p-4 shadow-lg relative flex items-center">
                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-pink-200 opacity-50 z-10"></div>
                    <div className="relative z-20 w-full max-w-full text-center">
    {deutsch.Transl_F.map((transl, index) => (
        <div key={index}>
            {transl.Transl_F.split(';').map((line, lineIndex) => (
                <p key={lineIndex} className="text-3xl mb-5 font-medium">
                    {line.trim()}
                </p>
            ))}
        </div>
    ))}
    {deutsch.Definition && (
        <p className="text-2xl mx-auto mt-4">
            {deutsch.Definition.split(';').map((line, lineIndex) => (
                <span key={lineIndex} className="block">
                    {line.trim()}
                </span>
            ))}
        </p>
    )}
</div>

                    <div className="absolute bottom-0 right-0 mb-5 mr-5 text-right">
                        <p className="text-sm">Hinzugefügt am: {deutsch.DateEntryWord}</p>
                    </div>
                </div>
            );
        }

        return (
            <div onClick={handleCardside}>
                {showContent1
                    ? <Content1 />
                    : <Content2 />
                }
            </div>
        );
    }

    if (session) {
        return <>
            <Head>
                <title>Wortbedeutungen</title>
            </Head>
            <div className="flex justify-between items-center bg-gray-100 p-4">
                <Link href="/" className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xm"><FontAwesomeIcon icon={faArrowLeft} className="mr-2 fa-lg fa-fw" />Übungsauswahl</Link>
                <div className="flex items-center">
                    <Image
                        src={session.user.image}
                        alt={session.user.name}
                        width={40}
                        height={40}
                        className="rounded-full mr-4"
                    />
                    <p className="text-gray-700 mr-4">{session.user.email}</p>
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-full" onClick={() => signOut()}>Abmelden</button>
                </div>
            </div>
            <div className="flex justify-between items-center w-full p-6">
      <a className="bg-light-400 hover:bg-light-500 flex justify-center items-center rounded-lg mr-8 mt-4" style={{ width: '300px', height: '150px' }}>
        </a>        {/* Titel zentriert und nach rechts verschoben */}
        <h1 className="text-5xl font-bold text-center flex-1 ml-16">Wortbedeutungen</h1>
        {/* Worterfassung-Box rechts, größer und zentriert */}
        <a onClick={handleOpen} className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-center items-center text-gray-700 font-bold text-xm"style={{ width: '300px', height: '100apx'}}>
          Filter
        </a>
      </div>
            <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
                
                <Card />
                <div className="flex justify-between items-center mb-4 mt-4">
                    <button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded mr-4 text-2xl" onClick={() => debouncedHandleClick(handleOK)}>
                        <FontAwesomeIcon icon={faCheck} className="mr-2 fa-lg fa-fw" />
                    </button>
                    <button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-2xl" onClick={() => debouncedHandleClick(handleNOK)}>
                        <FontAwesomeIcon icon={faTimes} className="mr-2 fa-lg fa-fw" />
                    </button>
                </div>

                <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8 mt-4">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
                            <p className="text-2xl font-bold">{deutschCount}</p>
                            <p className="text-xm font-medium text-gray-600 text-center">Erfasst</p>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
                            <p className="text-2xl font-bold">{standingSums.finished}</p>
                            <p className="text-xm font-medium text-gray-600 text-center">Vollständig erlernt</p>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
                            <p className="text-2xl font-bold">{standingSums.trainedSum}</p>
                            <p className="text-xm font-medium text-gray-600 text-center">Versuche in der Session</p>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-gray-200 rounded-lg p-4">
                            <p className="text-2xl font-bold">{standingSums.alltimeSum}</p>
                            <p className="text-xm font-medium text-gray-600 text-center">Versuche gesamt</p>
                        </div>
                    </div>
                    <div className=" flex justify-center mt-4">
                    <button className="max-w flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-2xl" onClick={() => debouncedHandleClick(handleREV)}><FontAwesomeIcon icon={faTrashRestore} className="mr-2 fa-lg fa-fw" /></button>
                </div>
                </div>




                {summary.length > 0 && (
                    <div>
                        <h1 className="text-2xl font-bold mt-8 mb-4">Zusammenfassung der laufenden Übungssession</h1>
                        <table className="table-auto">
                            <thead>
                                <tr>
                                    <th>Artikel</th>
                                    <th>Wort</th>
                                    <th>Französische Übersetzung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.map((obj) => {
                                    const deutsch = obj.summary;
                                    return (
                                        <tr>
                                            <td className="border px-4 py-2">
                                                <p className="normalp">{deutsch.Artikel}</p>
                                            </td>
                                            <td className="border px-4 py-2">
                                                <p className="normalp">{deutsch.Word}</p>
                                            </td>

                                            <td className="border px-4 py-2">
                                                {deutsch.Transl_F.map((transl, index) => (
                                                    <div key={index}>
                                                        <p className="normalp">{transl.Transl_F}</p>
                                                    </div>
                                                ))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div >)}
            </div >

            <Dialog open={open} handler={handleOpen}>
        <DialogHeader>Filter</DialogHeader>
        <DialogBody>
        <div className="relative">
                    {errorMessage && <Message message={errorMessage} />}
                    <input
    disabled={
        window.location.search.length > 0 || (newTypeOfWordFilter !== '' && isRootSearch !== true)
    }
    id="search"
    type="text"
    onFocus={handleFocus}
    onBlur={handleBlur}
    onChange={(e) => {
        const inputValue = e.target.value;
        setSearchInput(inputValue);

        if (isRootSearch) {
            updateRootSuggestions(inputValue); // Funktion für Stammwort-Suche
        } else {
            updateSuggestions(inputValue); // Funktion für globale Suche
        }
    }}
    value={searchInput}
    className={`mt-1 block w-full rounded-md border-2 'border-gray-400 focus:ring-indigo-500 focus:border-indigo-500' shadow-sm sm:text-sm px-3 py-2`}
    style={{ height: '2.5rem' }}
    placeholder={isRootSearch ? "Gib ein Stammwort ein..." : "Wortsuche..."} // Dynamischer Placeholder
    autoComplete="off"
    autofocus="none"
    tabindex="-1"
/>

                    {suggestions.length > 0 && (
                        <div className="z-30 absolute">
                            <div className="flex flex-wrap bg-white border border-gray-400 rounded shadow p-2 max-h-80 overflow-y-auto">
                                {suggestions
                                    .sort((a, b) => (a.Word && b.Word ? a.Word.localeCompare(b.Word) : 0))
                                    .map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleSuggestionClick(item.Word)}
                                            className="cursor-pointer mr-4 mb-4 p-2 border border-gray-300 rounded bg-gray-100"
                                        >
                                            {item.Word}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-4">
                        <label htmlFor="worttyp" className="block text_md font-medium text-gray-700">
                            Wortartsuche:
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div>
                                <input type="radio" id="AdjektivFilter" name="worttypFilter" value="Adjektiv"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="AdjektivFilter">Adjektiv</label>
                            </div>
                            <div>
                                <input type="radio" id="AdverbFilter" name="worttypFilter" value="Adverb"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="AdverbFilter">Adverb</label>
                            </div>
                            <div>
                                <input type="radio" id="AusdruckFilter" name="worttypFilter" value="Ausdruck"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== '' || isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="AusdruckFilter">Ausdruck</label>
                            </div>
                            <div>
                                <input type="radio" id="KonjunktionFilter" name="worttypFilter" value="Konjunktion"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== '' || isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="KonjunktionFilter">Konjunktion</label>
                            </div>
                            <div>
                                <input type="radio" id="NomenFilter" name="worttypFilter" value="Nomen"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="NomenFilter">Nomen</label>
                            </div>
                            <div>
                                <input type="radio" id="PartizipFilter" name="worttypFilter" value="Partizip"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="PartizipFilter">Partizip</label>
                            </div>
                        </div>
                        <div>
                            <div>
                                <input type="radio" id="PräpositionFilter" name="worttypFilter" value="Präposition"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="PräpositionFilter">Präposition</label>
                            </div>
                            <div>
                                <input type="radio" id="IntransitivesVerbFilter" name="worttypFilter" value="Intransitives Verb"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="IntransitivesVerbFilter">Verb (Intransitiv)</label>
                            </div>
                            <div>
                                <input type="radio" id="ReflexivesVerbFilter" name="worttypFilter" value="Reflexives Verb"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="UnpersönlichesVerbFilter">Verb (Reflexiv)</label>
                            </div>
                            <div>
                                <input type="radio" id="TransitivesVerbFilter" name="worttypFilter" value="Transitives Verb"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== ''|| isRootSearch) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="TransitivesVerbFilter">Verb (Transitiv)</label>
                            </div>
                            <div>
                                <input type="radio" id="UnpersönlichesVerbFilter" name="worttypFilter" value="Unpersönliches Verb"
                                    disabled={window.location.search.length > 0 || searchInput !== '' || isRootSearch }
                                    onChange={e => setNewTypeOfWordFilter(e.target.value)}
                                    className={`mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500 ${(window.location.search.length > 0 || searchInput !== '' || isRootSearch ) &&
                                        'bg-gray-300'
                                        }`} />
                                <label htmlFor="UnpersönlichesVerbFilter">Verb (Unpersönlich)</label>
                            </div>
                            <div>
    <input
        type="checkbox"
        id="RootSearchFilter"
        name="Root"
        checked={isRootSearch}
        onChange={handleRootSearchToggle}
        className={`mr-2 appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500`}
    />
    <label htmlFor="RootSearchFilter">Nach Stamm suchen</label>
</div>

                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handleFilterClick}
                            htmlFor="search"
                            className={`flex-1 mr-4 mt-4 mb-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-blue-500 hover:bg-blue-700 ${(window.location.search.length > 0 ||
                                (searchInput === '' && newTypeOfWordFilter === '') ||
                                (filteredSuggestions.every(
                                    (item) =>
                                        item?.Word.toLowerCase().replace(/\s+\(\d+\)$/, '') !==
                                        searchInput.toLowerCase()
                                ) && newTypeOfWordFilter === '') ||
                                (searchInput !== '' && newTypeOfWordFilter !== '')) &&
                                'hover:bg-blue-700'
                                }`}>
                            <FontAwesomeIcon icon={faFilter} className="mr-2 fa-lg fa-fw" /></button>
                        <button className={`flex-1 mt-4 mb-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-red-500 hover:bg-red-600 ${(window.location.search.length === 0 && newTypeOfWordFilter === '' && searchInput === '') &&
                            'hover:bg-red-600'
                            } `}
                            onClick={handleRemoveFilter} disabled={window.location.search.length === 0 && newTypeOfWordFilter === '' && searchInput === ''}>
                            <FontAwesomeIcon icon={faFilter} className="mr-2 fa-lg fa-fw" />
                        </button>
                    </div>
                </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={handleOpen}
            className="mr-1"
          >
            <span>Cancel</span>
          </Button>
          <Button variant="gradient" color="green" onClick={handleOpen}>
            <span>Confirm</span>
          </Button>
        </DialogFooter>
      </Dialog>
        </>
    }
}