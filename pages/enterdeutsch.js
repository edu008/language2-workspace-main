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

export async function getServerSideProps(context) {
    const session = await getSession(context)
    if (session) {
        const deutsch = await getDeutsch();

        const { query } = context;

        const searchInput = query.searchInput || '';
        const radioInput = query.radioInput || '';

        deutsch.forEach(document => {
            document.Article.forEach(article => {
                if (article.DateSource instanceof Date) {
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
            if (searchInput !== '' && deutschObj.Word) {
                return deutschObj.Word === searchInput;
            }
            else if (radioInput !== '' && deutschObj.TypeOfWord) {
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

export default function Deutsch({ summary, filteredDeutsch }) {

    const { data: session } = useSession()
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
    const [suggestions, setSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [newTypeOfWordFilter, setNewTypeOfWordFilter] = useState("");

    console.log(summary)


    const updateSuggestions = (inputValue) => {
        if (filteredDeutsch && filteredDeutsch.length > 0) {
            const duplicatesCount = filteredDeutsch.reduce((countMap, item) => {
                const word = item?.Word;
                if (word && word.toLowerCase().includes(inputValue.toLowerCase())) {
                    countMap[word] = (countMap[word] || 0) + 1;
                }
                return countMap;
            }, {});

            const filteredResults = Object.keys(duplicatesCount).map((word) => {
                const count = duplicatesCount[word];
                return {
                    Word: `${word} (${count})`,
                };
            });

            setSuggestions(filteredResults);
            setFilteredSuggestions(filteredResults);

            const matchingEntries = filteredDeutsch.filter(
                (item) =>
                    item?.Word &&
                    item.Word.toLowerCase() === inputValue.toLowerCase()
            );

            if (matchingEntries.length === 0 && inputValue !== "") {
                setErrorMessage(
                    'Dieses Wort ist nicht erfasst oder du hast es bereits vollständig erlernt!'
                );
            } else {
                setErrorMessage('');
            }
        } else {
            setFilteredSuggestions([]);
            setSuggestions([]);
        }
    };

       

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

    

    if (session) {
        return <>
            <Head>
                <title>Wortbedeutungen</title>
            </Head>
            <div className="flex justify-between items-center bg-gray-100 p-4">
                <Link href="/Worterfassung" className="py-2 px-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xm"><FontAwesomeIcon icon={faArrowLeft} className="mr-2 fa-lg fa-fw" />Worterfassung</Link>
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
            <div className="max-w-5xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
                <h1 className="text-5xl font-bold text-center mb-8">Wortbedeutungen</h1>
                <form className="my-4">
                    <h1 className="text-2xl font-bold mb-4">Neue Wortbedeutung erfassen</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="mb-5">
                                <div>
                                    <label htmlFor="word" className="block text_md font-medium text-gray-700">
                                        Wort:
                                    </label>
                                </div>
                                <div>
                                    <input
                                        id="word"
                                        type="text"
                                        onChange={(e) => setNewWord(e.target.value)}
                                        value={newWord}
                                        className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                        style={{ height: '2.5rem' }}
                                    />
                                </div>
                            </div>
                            <div className="mb-5">
                                <div>
                                    <label htmlFor="prefix" className="block text_md font-medium text-gray-700">
                                        Präfix:
                                    </label>
                                </div>
                                <div>
                                    <input
                                        id="prefix"
                                        type="text"
                                        onChange={(e) => setNewPrefix(e.target.value)}
                                        value={newPrefix}
                                        className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                        style={{ height: '2.5rem' }}
                                    />
                                </div>
                            </div>
                            <div className="mb-5">
                                <div>
                                    <label htmlFor="root" className="block text_md font-medium text-gray-700">
                                        Stamm:
                                    </label>
                                </div>
                                <div>
                                    <input
                                        id="root"
                                        type="text"
                                        onChange={(e) => setNewRoot(e.target.value)}
                                        value={newRoot}
                                        className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                        style={{ height: '2.5rem' }}
                                    />
                                </div>
                            </div>
                            <div className="mb-5">
                                <div>
                                    <label htmlFor="structure" className="block text_md font-medium text-gray-700">
                                        Struktur:
                                    </label>
                                </div>
                                <div>
                                    <input
                                        id="structure"
                                        type="text"
                                        onChange={(e) => setNewStructure(e.target.value)}
                                        value={newStructure}
                                        className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                        style={{ height: '2.5rem' }}
                                    />
                                </div>
                            </div>
                            <div className="mb-12">
                                <div>
                                    <label htmlFor="definition" className="block text_md font-medium text-gray-700">
                                        Definition:
                                    </label>
                                </div>
                                <div>
                                    <input
                                        id="definition"
                                        type="text"
                                        onChange={(e) => setNewDefinition(e.target.value)}
                                        value={newDefinition}
                                        className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                        style={{ height: '2.5rem' }}
                                    />
                                </div>
                            </div>
                            <div className="mb-5 mt-2">
                                {articles.map((article, index) => (
                                    <div key={index} className="bg-blue-100 relative mb-9 rounded-md">
                                        <div>
                                            <label
                                                className="block text-xl font-medium text-gray-700"
                                            >
                                                Beispiel {index + 1}
                                            </label>
                                        </div>

                                        <div>
                                            <div>
                                                <label htmlFor={`title_${index}`} className="block text-md font-medium text-gray-700">
                                                    Titel:
                                                </label>
                                            </div>
                                            <div>
                                                <input
                                                    id={`title_${index}`}
                                                    type="text"
                                                    onChange={(e) => handleArticleFieldChange(index, 'TitleOfArticle', e.target.value)}
                                                    value={article.TitleOfArticle}
                                                    className="mt-1 mb-5 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                                    style={{ height: '2.5rem' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div>
                                                <label htmlFor={`sentence_${index}`} className="block text-md font-medium text-gray-700">
                                                    Satz:
                                                </label>
                                            </div>
                                            <div>
                                                <input
                                                    id={`sentence_${index}`}
                                                    type="text"
                                                    onChange={(e) => handleArticleFieldChange(index, 'Sentence_D', e.target.value)}
                                                    value={article.Sentence_D}
                                                    className="mt-1 mb-5 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                                    style={{ height: '2.5rem' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div>
                                                <label htmlFor={`source_${index}`} className="block text-md font-medium text-gray-700">
                                                    Quelle:
                                                </label>
                                            </div>
                                            <div>
                                                <input
                                                    id={`source_${index}`}
                                                    type="text"
                                                    onChange={(e) => handleArticleFieldChange(index, 'Source', e.target.value)}
                                                    value={article.Source}
                                                    className="mt-1 mb-5 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                                    style={{ height: '2.5rem' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div>
                                                <label htmlFor={`date_${index}`} className="block text-md font-medium text-gray-700">
                                                    Veröffentlichung:
                                                </label>
                                            </div>
                                            <div>
                                                <input
                                                    id={`date_${index}`}
                                                    type="date"
                                                    onChange={(e) => handleArticleFieldChange(index, 'DateSource', e.target.value)}
                                                    value={article.DateSource}
                                                    className="mt-1 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                                    style={{ height: '2.5rem' }}
                                                    max={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            {index === 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddArticle();
                                                    }}
                                                    className="absolute right-1 top-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded-md"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="fa-lg fa-fw" />
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            {index > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveArticle(index);
                                                    }}
                                                    className="absolute right-1 top-0 mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded-md"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="fa-lg fa-fw" />
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="mb-5">
                                <div>
                                    <label htmlFor="artikel" className="block text-md font-medium text-gray-700">
                                        Artikel:
                                    </label>
                                </div>
                                <div>
                                    <input type="radio" id="keiner" name="artikel" value="" defaultChecked
                                        onChange={e => setNewArtikel(e.target.value)} className="mr-2  appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="keiner">Keiner</label>
                                </div>
                                <div>
                                    <input type="radio" id="der" name="artikel" value="der"
                                        onChange={e => setNewArtikel(e.target.value)} className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="der"  >der</label>
                                </div>
                                <div>
                                    <input type="radio" id="die" name="artikel" value="die"
                                        onChange={e => setNewArtikel(e.target.value)} className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="die" >die</label>
                                </div>
                                <div>
                                    <input type="radio" id="das" name="artikel" value="das"
                                        onChange={e => setNewArtikel(e.target.value)} className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded-full checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="das" >das</label>
                                </div>
                            </div>
                            <div className="mb-5">
                                <div>
                                    <label htmlFor="worttyp" className="block text_md font-medium text-gray-700">
                                        Wortart:
                                    </label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Adjektiv" name="worttyp" value="Adjektiv"
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Adjektiv')}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Adjektiv">Adjektiv</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Adverb" name="worttyp" value="Adverb"
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Adverb')}
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Adverb">Adverb</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Ausdruck" name="worttyp" value="Ausdruck"
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Ausdruck')}
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Ausdruck">Ausdruck</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Konjunktion" name="worttyp" value="Konjunktion"
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Konjunktion')}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Konjunktion">Konjunktion</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Nomen" name="worttyp" value="Nomen"
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Nomen')}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Nomen">Nomen</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Partizip" name="worttyp" value="Partizip"
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Partizip')}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Partizip">Partizip</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Präposition" name="worttyp" value="Präposition"
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Präposition')}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Präposition">Präposition</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="Pronomen" name="worttyp" value="Pronomen"
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Pronomen')}
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="Pronomen">Pronomen</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="IntransitivesVerb" name="worttyp" value="Intransitives Verb"
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Intransitives Verb')}
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="IntransitivesVerb">Verb (Intransitiv)</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="ReflexivesVerb" name="worttyp" value="Reflexives Verb"
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Reflexives Verb')}
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="reflexivesVerb">Verb (Reflexiv)</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="TransitivesVerb" name="worttyp" value="Transitives Verb"
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Transitives Verb')}
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="TransitivesVerb">Verb (Transitiv)</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="UnpersönlichesVerb" name="worttyp" value="Unpersönliches Verb"
                                        checked={newTypeOfWord.some(type => type.TypeOfWord === 'Unpersönliches Verb')}
                                        onChange={(e) => handleCheckboxChange(e, e.target.value)}
                                        className="mr-2 appearance-none h-4 w-4 border border-gray-400 rounded checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-blue-500" />
                                    <label htmlFor="UnpersönlichesVerb">Verb (Unpersönlich)</label>
                                </div>
                            </div>
                            <div className="bg-blue-100 mb-5 rounded-md">
                                <div>
                                    <label
                                        className="block text_md font-medium text-gray-700"
                                    >
                                        Französische Übersetzungen:
                                    </label>
                                </div>
                                {translations.map((translation, index) => (
                                    <div key={index} className="relative">
                                        <div>
                                            {index === 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddTranslation();
                                                    }}
                                                    className="absolute right-1 top-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded-md"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="fa-lg fa-fw" />
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                id={`translation_${index}`}
                                                type="text"
                                                onChange={(e) => handleTranslationChange(index, e.target.value)}
                                                value={translation.Transl_F || ''}
                                                className="mt-1 mb-0 block w-full rounded-md border-2 border-gray-400 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                                                style={{ height: '2.5rem' }}
                                            />
                                        </div>
                                        <div>
                                            {index > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveTranslation(index);
                                                    }}
                                                    className="absolute right-1 top-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded-md"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="fa-lg fa-fw" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {message && <Message message={message} />}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            addDeutsch();
                        }}
                        className="mt-4 w-full px-4 py-2 rounded text-2xl font-semibold text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} className="mr-2 fa-lg fa-fw" />
                    </button>
                </form>                
            </div >
        </>
    }
}