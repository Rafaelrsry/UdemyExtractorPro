
const btnRegresar = document.getElementById('btn-regresar-menu');
const appTitulo = document.getElementById('app-titulo');
const appSubtitulo = document.getElementById('app-subtitulo');

const viewMenu = document.getElementById('view-menu');
const viewGaleria = document.getElementById('view-galeria');
const viewClases = document.getElementById('view-clases');

const gridCursos = document.getElementById('grid-cursos');
const txtCursoTitulo = document.getElementById('txt-curso-titulo');
const estadoIndex = document.getElementById('estado-index');
const contenedorLista = document.getElementById('lista-videos-descarga');


let vistaAnterior = 'menu';

function navegarA(vista) {
 
    viewMenu.classList.remove('active-view');
    viewGaleria.classList.remove('active-view');
    viewClases.classList.remove('active-view');
    
    if (vista === 'menu') {
        appTitulo.innerText = "📥 Extractor Udemy HQ";
        appSubtitulo.innerText = "Sign in to Udemy before running the program.";
        btnRegresar.style.display = 'none';
        viewMenu.classList.add('active-view');
        vistaAnterior = 'menu';
    } 
    else if (vista === 'galeria') {
        appTitulo.innerText = "🖼️ Your Courses";
        appSubtitulo.innerText = "Select a course to view its syllabus.";
        btnRegresar.style.display = 'block';
        viewGaleria.classList.add('active-view');
        vistaAnterior = 'menu'; 
    } 
    else if (vista === 'clases') {
        appTitulo.innerText = "📥 Videos";
        appSubtitulo.innerText = "Extractor Udemy HQ ";
        btnRegresar.style.display = 'block';
        viewClases.classList.add('active-view');
    }
}


btnRegresar.addEventListener('click', () => {
    navegarA(vistaAnterior);
});


document.getElementById('btn-galeria').addEventListener('click', async () => {
    gridCursos.innerHTML = "<p style='text-align:center; font-size:12px; color:#6a6f73; padding:20px;'>⏳ Synchronizing...</p>";
    navegarA('galeria');
    
    try {
        const resMisCursos = await fetch("https://www.udemy.com/api-2.0/users/me/subscribed-courses/?page_size=100&fields[course]=id,title,image_480x270");
        const dataCursos = await resMisCursos.json();
        
        gridCursos.innerHTML = "";
        if (!dataCursos.results || dataCursos.results.length === 0) {
            gridCursos.innerHTML = `<p style="font-size:12px; color:#e63946; grid-column:span 2; text-align:center;">❌ No se encontraron cursos activos en esta cuenta de Udemy.</p>`;
            return;
        }

        dataCursos.results.forEach(curso => {
            const card = document.createElement('div');
            card.className = "card-curso";
            card.innerHTML = `
                <img src="${curso.image_480x270}" alt="Portada" style="width:100%; height:100px; object-fit:cover; border-bottom:1px solid #d1d7dc;">
                <div style="padding:10px; flex:1; display:flex; flex-direction:column; justify-content:between;">
                    <span style="font-size:11px; color:#1c1d1f; font-weight:bold; line-height:1.3; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:8px;">
                        ${curso.title}
                    </span>
                    <button style="width:100%; background:#a435f0; color:white; border:none; padding:6px; border-radius:4px; font-size:10px; font-weight:bold; cursor:pointer;">Select</button>
                </div>
            `;

            card.addEventListener('click', () => {
                vistaAnterior = 'galeria'; 
                mapearTemarioCurso(curso.id, curso.title);
            });
            gridCursos.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        gridCursos.innerHTML = `<p style="color:#e63946; font-size:12px; text-align:center; grid-column:span 2;">❌ Error al conectar con Udemy. ¿Estás logueado?</p>`;
    }
});


document.getElementById('btn-pagina').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: false });
    const tab = tabs.find(t => t.url && t.url.includes("udemy.com/course/"));
    
    if (!tab) {
        alert("⚠️ Please go to the tab for the course you want to export.");
        return;
    }

    const coincidencia = tab.url.match(/\/course\/([^\/]+)/);
    const cursoSlug = coincidencia && coincidencia[1] ? coincidencia[1] : '';

    if (!cursoSlug) {
        alert("⚠️ No se pudo procesar la firma del curso en la pestaña activa.");
        return;
    }

    vistaAnterior = 'menu';
    navegarA('clases');
    
    estadoIndex.innerText = "🔍 Searching for the ID of the active course...";
    contenedorLista.innerHTML = "";

    try {
        const resCursoInfo = await fetch(`https://www.udemy.com/api-2.0/courses/${cursoSlug}/?fields[course]=id,title`);
        if (!resCursoInfo.ok) throw new Error("Error en datos base.");
        const dataCurso = await resCursoInfo.json();
        mapearTemarioCurso(dataCurso.id, dataCurso.title);
    } catch (e) {
        console.error(e);
        estadoIndex.innerText = "❌ Error de sincronización de datos de la pestaña.";
        estadoIndex.style.color = "#e63946";
    }
});


async function mapearTemarioCurso(courseId, cursoTitulo) {
    txtCursoTitulo.innerText = `Curso: ${cursoTitulo}`;
    estadoIndex.innerText = "⏳ Extracting ...";
    estadoIndex.style.color = "#a435f0";
    contenedorLista.innerHTML = "";
    
    navegarA('clases');

    try {
        const resCurriculum = await fetch(`https://www.udemy.com/api-2.0/courses/${courseId}/subscriber-curriculum-items/?page_size=500&fields[lecture]=title,asset,object_index&fields[asset]=asset_type,stream_urls`);
        const dataCurriculum = await resCurriculum.json();

        const videos = dataCurriculum.results.filter(item => item._class === "lecture" && item.asset && item.asset.asset_type === "Video");

        if (videos.length === 0) {
            estadoIndex.innerText = "⚠️ There are no videos available for this course, or they are protected by DRM.";
            estadoIndex.style.color = "#e63946";
            return;
        }

        estadoIndex.innerHTML = `✅ <b>¡Index loaded!</b> (${videos.length} videos found)`;
        estadoIndex.style.color = "#2ec4b6";

        videos.forEach((vid, index) => {
            const itemVideo = document.createElement('div');
            itemVideo.className = "item-video";
            itemVideo.innerHTML = `
                <span style="font-size:11px; color:#1c1d1f; font-weight:500; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; max-width:72%; line-height:1.3;">
                    <b>${vid.object_index || (index + 1)}.</b> ${vid.title}
                </span>
                <button id="btn-descargar-${index}" class="btn-bajar">Download HQ</button>
            `;
            contenedorLista.appendChild(itemVideo);

            itemVideo.querySelector(`#btn-descargar-${index}`).addEventListener('click', async () => {
                const boton = itemVideo.querySelector(`#btn-descargar-${index}`);
                boton.innerText = "...";
                boton.style.background = "#6a6f73";
                boton.disabled = true;

                const streamUrls = vid.asset?.stream_urls;
                if (streamUrls && streamUrls.Video) {
                    const mp4Directo = streamUrls.Video.find(v => v.type === "video/mp4" && (v.label === "1080" || v.label === "720"));
                    const hlsStream = streamUrls.Video.find(v => v.type === "application/x-mpegURL" || v.file.includes('.m3u8'));

                    if (mp4Directo) {
                        window.open(mp4Directo.file, '_blank');
                        boton.innerText = "✓ Ready";
                        boton.style.background = "#2ec4b6";
                        boton.disabled = false;
                    } else if (hlsStream) {
                        await procesarDescargaHls(hlsStream.file, vid.title, boton);
                    } else {
                        boton.innerText = "🔒 DRM";
                        boton.style.background = "#e63946";
                    }
                } else {
                    boton.innerText = "No Disp.";
                    boton.style.background = "#e63946";
                }
            });
        });
    } catch (e) {
        console.error(e);
        estadoIndex.innerText = "❌ Error al mapear el temario del curso.";
        estadoIndex.style.color = "#e63946";
    }
}





async function procesarDescargaHls(masterUrl, tituloVideo, boton) {
    try {
        const resMaster = await fetch(masterUrl);
        const textMaster = await resMaster.text();
        const lineasMaster = textMaster.split('\n');
        let playlists = [];
        
        for (let i = 0; i < lineasMaster.length; i++) {
            if (lineasMaster[i].includes('.m3u8')) {
                let urlSub = lineasMaster[i].trim();
                if (!urlSub.startsWith('http')) {
                    urlSub = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1) + urlSub;
                }
                playlists.push(urlSub);
            }
        }
        if (playlists.length === 0) playlists.push(masterUrl);
        let subUrl = playlists[playlists.length - 1];
        
        const altaCalidad = playlists.find(url => url.includes("1920x1080") || url.includes("1200k") || url.includes("AVC_1080"));
        if (altaCalidad) subUrl = altaCalidad;

        const resPlaylist = await fetch(subUrl);
        const textPlaylist = await resPlaylist.text();
        const fragmentos = textPlaylist.split('\n').filter(l => l.includes('.ts'));

        if (fragmentos.length === 0) {
            boton.innerText = "⚠️ Error TS";
            boton.style.background = "#e63946";
            boton.disabled = false;
            return;
        }

        let bloquesBinarios = [];
        const totalFragmentos = fragmentos.length;

        for (let i = 0; i < totalFragmentos; i++) {
            let urlTs = fragmentos[i].trim();
            if (!urlTs.startsWith('http')) {
                urlTs = subUrl.substring(0, subUrl.lastIndexOf('/') + 1) + urlTs;
            }
            let res = await fetch(urlTs);
            let buf = await res.arrayBuffer();
            bloquesBinarios.push(new Uint8Array(buf));
            boton.innerText = `${(((i + 1) / totalFragmentos) * 100).toFixed(0)}%`;
        }

        let tamano = bloquesBinarios.reduce((acc, c) => acc + c.length, 0);
        let videoUnificado = new Uint8Array(tamano);
        let pos = 0;
        for (let b of bloquesBinarios) {
            videoUnificado.set(b, pos);
            pos += b.length;
        }

        const blob = new Blob([videoUnificado], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tituloVideo.replace(/[^a-z0-9]/gi, '_')}_HQ.mp4`;
        a.click();

        boton.innerText = "✓ Listo";
        boton.style.background = "#2ec4b6";
        boton.disabled = false;
    } catch (e) {
        console.error(e);
        boton.innerText = "❌ Falló";
        boton.style.background = "#e63946";
        boton.disabled = false;
    }



    
}


let cursoIdActivoGlobal = null; 


const originalMapearTemarioCurso = mapearTemarioCurso;
mapearTemarioCurso = async function(courseId, cursoTitulo) {
    cursoIdActivoGlobal = courseId; 
    return originalMapearTemarioCurso(courseId, cursoTitulo);
};

document.getElementById('btn-completar-ciclo').addEventListener('click', async () => {
    if (!cursoIdActivoGlobal) {
        alert("⚠️ Por favor selecciona primero un curso válido de la lista.");
        return;
    }

    const botonCiclo = document.getElementById('btn-completar-ciclo');
    const panelProgreso = document.getElementById('progreso-automatizador');
    const txtStatus = document.getElementById('txt-fase-status');
    const barraProgreso = document.getElementById('barra-fase-progreso');

    // Bloquear Interfaz temporalmente
    botonCiclo.disabled = true;
    botonCiclo.style.background = "#6a6f73";
    botonCiclo.innerText = "⏳ Procesando ciclo automático...";
    panelProgreso.style.display = "block";
    barraProgreso.style.width = "0%";

    const cabecerasBase = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "es-ES",
        "content-type": "application/json",
        "priority": "u=1, i",
        "x-requested-with": "XMLHttpRequest"
    };

    try {
       
        txtStatus.innerHTML = "🔍 Analizando plan de estudios...";
        barraProgreso.style.width = "5%";
        
        const resCurriculum = await fetch(`https://www.udemy.com/api-2.0/courses/${cursoIdActivoGlobal}/subscriber-curriculum-items/?page_size=500&fields[lecture]=id,title&fields[quiz]=id,title`, {
            method: "GET",
            headers: { "accept": "application/json, text/plain, */*" },
            credentials: "include"
        });

        if (!resCurriculum.ok) throw new Error("No se pudo leer la estructura desde la API.");
        const dataCurriculum = await resCurriculum.json();
        
        const lecciones = dataCurriculum.results.filter(item => item._class === "lecture");
        const evaluaciones = dataCurriculum.results.filter(item => item._class === "quiz");
        
        // El peso total para el cálculo del progreso porcentual
        const totalElementos = lecciones.length + (evaluaciones.length * 2);
        let elementosProcesados = 0;

      
        txtStatus.innerHTML = `📺 <b>Fase 1/3:</b> Iniciando marcado...`;
        
       
        for (let i = 0; i < lecciones.length; i++) {
            await fetch(`https://www.udemy.com/api-2.0/users/me/subscribed-courses/${cursoIdActivoGlobal}/completed-lectures/`, {
                method: "POST", headers: cabecerasBase, credentials: "include",
                body: JSON.stringify({ "lecture_id": lecciones[i].id, "downloaded": false })
            });
            elementosProcesados++;
            barraProgreso.style.width = `${Math.min(5 + (elementosProcesados / totalElementos) * 40, 45)}%`;
            txtStatus.innerHTML = `📺 <b>Fase 1/3:</b> Marcando Clases (${i + 1}/${lecciones.length})`;
            await new Promise(r => setTimeout(r, 250));
        }

       
        for (let i = 0; i < evaluaciones.length; i++) {
            await fetch(`https://www.udemy.com/api-2.0/users/me/subscribed-courses/${cursoIdActivoGlobal}/quizzes/${evaluaciones[i].id}/user-attempted-quizzes/`, {
                method: "POST", headers: cabecerasBase, credentials: "include",
                body: JSON.stringify({ "marked_completed": true })
            });
            elementosProcesados++;
            barraProgreso.style.width = `${5 + (elementosProcesados / totalElementos) * 40}%`;
            txtStatus.innerHTML = `⚡ <b>Fase 1/3:</b> Prácticas (${i + 1}/${evaluaciones.length})`;
            await new Promise(r => setTimeout(r, 250));
        }

      
        for (let j = 0; j < evaluaciones.length; j++) {
            const cuerpoGraphQL = {
                "query": "\n    mutation QuizMarkComplete($quizId: ID!) {\n  quizMarkComplete(quizId: $quizId)\n}\n    ",
                "variables": { "quizId": String(evaluaciones[j].id) }
            };
            await fetch("https://www.udemy.com/api/2024-01/graphql/", {
                method: "POST", headers: cabecerasBase, credentials: "include", body: JSON.stringify(cuerpoGraphQL)
            });
            elementosProcesados++;
            barraProgreso.style.width = `${5 + (elementosProcesados / totalElementos) * 40}%`;
            txtStatus.innerHTML = `📝 <b>Fase 1/3:</b> Cuestionarios (${j + 1}/${evaluaciones.length})`;
            await new Promise(r => setTimeout(r, 250));
        }

    
        barraProgreso.style.width = "50%";
        txtStatus.innerHTML = "📡 <b>Fase 2/3:</b> Indexando certificado en los servidores...";
        await new Promise(r => setTimeout(r, 2000));

        const resCertificados = await fetch("https://www.udemy.com/api-2.0/users/me/certificates/?page_size=100", {
            method: "GET",
            headers: { "accept": "application/json, text/plain, */*", "x-requested-with": "XMLHttpRequest" },
            credentials: "include"
        });

        const dataCert = await resCertificados.json();
        const certificadoMatch = dataCert.results?.find(cert => cert.course_id === cursoIdActivoGlobal);

        if (certificadoMatch && certificadoMatch.long_url) {
            txtStatus.innerHTML = "🎉 <b>¡Certificado Encontrado!</b> Abriendo pestaña...";
            chrome.tabs.create({ url: certificadoMatch.long_url });
        } else {
            txtStatus.innerHTML = "⚠️ Sincronización lenta de Udemy. Abriendo vía bypass directo...";
            chrome.tabs.create({ url: `https://www.udemy.com/certificate/completion/${cursoIdActivoGlobal}/` });
        }

        await new Promise(r => setTimeout(r, 1500));

    
        txtStatus.innerHTML = "🔄 <b>Fase 3/3:</b> Removiendo marcas para restaurar avance...";
        let elementosBorrados = 0;

        
        for (let i = 0; i < lecciones.length; i++) {
            await fetch(`https://www.udemy.com/api-2.0/users/me/subscribed-courses/${cursoIdActivoGlobal}/completed-lectures/${lecciones[i].id}/`, {
                method: "DELETE", headers: cabecerasBase, credentials: "include"
            });
            elementosBorrados++;
            barraProgreso.style.width = `${50 + (elementosBorrados / totalElementos) * 50}%`;
            txtStatus.innerHTML = `🔓 <b>Fase 3/3:</b> Limpiando clases (${i + 1}/${lecciones.length})`;
            await new Promise(r => setTimeout(r, 250));
        }

       
        for (let i = 0; i < evaluaciones.length; i++) {
            await fetch(`https://www.udemy.com/api-2.0/users/me/subscribed-courses/${cursoIdActivoGlobal}/quizzes/${evaluaciones[i].id}/user-attempted-quizzes/`, {
                method: "POST", headers: cabecerasBase, credentials: "include",
                body: JSON.stringify({ "marked_completed": false })
            });
            elementosBorrados++;
            barraProgreso.style.width = `${50 + (elementosBorrados / totalElementos) * 50}%`;
            txtStatus.innerHTML = `🔓 <b>Fase 3/3:</b> Limpiando evaluaciones (${i + 1}/${evaluaciones.length})`;
            await new Promise(r => setTimeout(r, 250));
        }

      
        barraProgreso.style.width = "100%";
        txtStatus.innerHTML = "🏁 <b>¡Ciclo Completado!</b> Avance limpio a cero.";
        botonCiclo.innerText = "✓ Ejecutado Correctamente";
        botonCiclo.style.background = "#2ec4b6";

    } catch (err) {
        console.error(err);
        txtStatus.innerHTML = "<span style='color:#e63946;'>❌ Error interno en los servidores de Udemy.</span>";
        botonCiclo.innerText = "💥 Reintentar Ciclo";
        botonCiclo.style.background = "#e63946";
    } finally {
       
        setTimeout(() => {
            botonCiclo.disabled = false;
            if(botonCiclo.style.background !== "rgb(230, 57, 70)") {
                botonCiclo.style.background = "#2ec4b6";
                botonCiclo.innerText = "🚀Obtener Certificado !";
                panelProgreso.style.display = "none";
                barraProgreso.style.width = "0%";
            }
        }, 4000);
    }
});


