// Variables globales
let currentQR = null;
const MAX_HISTORY_ITEMS = 50;

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar último QR generado si existe
    const historial = JSON.parse(localStorage.getItem("qrHistorial")) || [];
    if (historial.length > 0) {
        mostrarUltimoQR(historial);
    }
    
    // Configurar event listeners
    document.getElementById('link').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') generarQR();
    });
});

// Función principal para generar QR
function generarQR() {
    const linkInput = document.getElementById("link");
    const link = linkInput.value.trim();
    const qrColor = document.getElementById("qr-color").value;
    const qrBg = document.getElementById("qr-bg").value;
    
    if (!validarURL(link)) {
        mostrarError("Por favor, ingresa un enlace válido (ej: https://ejemplo.com)");
        linkInput.focus();
        return;
    }

    // Crear QR
    currentQR = new QRious({
        element: document.getElementById("qr-canvas"),
        value: link,
        size: 256,
        level: 'H',
        foreground: qrColor,
        background: qrBg
    });

    // Mostrar acciones
    document.getElementById("descargar").style.display = "inline-flex";
    document.getElementById("ver-historial").style.display = "inline-flex";
    
    // Agregar al historial
    guardarEnHistorial(link, currentQR.toDataURL("image/png"));
    
    // Mostrar notificación
    mostrarExito("¡QR generado con éxito!");
}

// Función mejorada para descargar QR
function descargarQR() {
    if (!currentQR) {
        mostrarError("No hay ningún QR para descargar");
        return;
    }
    
    const enlace = document.getElementById("link").value.trim();
    const dominio = enlace ? new URL(enlace).hostname.replace('www.', '') : 'qr';
    const nombreArchivo = `qr_${dominio}_${new Date().toISOString().slice(0,10)}.png`;
    
    const enlaceDescarga = document.createElement("a");
    enlaceDescarga.href = currentQR.toDataURL("image/png");
    enlaceDescarga.download = nombreArchivo;
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);
    
    mostrarExito("¡QR descargado con éxito!");
}

// Función mejorada para validar URLs
function validarURL(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Guardar en historial con límite de items
function guardarEnHistorial(link, qrData) {
    let historial = JSON.parse(localStorage.getItem("qrHistorial")) || [];
    
    // Evitar duplicados recientes
    if (historial.length > 0 && historial[historial.length - 1].link === link) {
        return;
    }
    
    // Agregar nuevo item
    historial.push({
        link,
        qrData,
        fecha: new Date().toISOString(),
        visitas: 0
    });
    
    // Limitar el tamaño del historial
    if (historial.length > MAX_HISTORY_ITEMS) {
        historial = historial.slice(historial.length - MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem("qrHistorial", JSON.stringify(historial));
}

// Mostrar historial mejorado
function mostrarHistorial() {
    const historial = JSON.parse(localStorage.getItem("qrHistorial")) || [];
    const historialContainer = document.getElementById("historial-container");
    const historialList = document.getElementById("historial-list");
    
    historialList.innerHTML = "";
    
    if (historial.length === 0) {
        historialList.innerHTML = `<p class="empty-history">No hay elementos en el historial</p>`;
        historialContainer.style.display = "block";
        return;
    }
    
    // Ordenar por fecha (más reciente primero)
    historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    historial.forEach((item, index) => {
        const fecha = new Date(item.fecha).toLocaleString();
        const dominio = new URL(item.link).hostname.replace('www.', '');
        
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";
        historyItem.innerHTML = `
            <div class="history-item-header">
                <span class="history-domain">${dominio}</span>
                <span class="history-date">${fecha}</span>
            </div>
            <a href="${item.link}" target="_blank" class="history-link" title="Visitar enlace">
                <i class="fas fa-external-link-alt"></i> ${item.link}
            </a>
            <img src="${item.qrData}" alt="QR Code" class="history-qr">
            <div class="history-item-actions">
                <button onclick="descargarQRDesdeHistorial('${item.qrData}', '${dominio}')" class="action-btn download-btn">
                    <i class="fas fa-download"></i> Descargar
                </button>
                <button onclick="eliminarQR(${index})" class="action-btn delete-btn">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        historialList.appendChild(historyItem);
    });
    
    historialContainer.style.display = "block";
}

// Función para descargar QR desde historial
function descargarQRDesdeHistorial(qrData, dominio) {
    const nombreArchivo = `qr_${dominio}_${new Date().toISOString().slice(0,10)}.png`;
    
    const enlaceDescarga = document.createElement("a");
    enlaceDescarga.href = qrData;
    enlaceDescarga.download = nombreArchivo;
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);
    
    mostrarExito("¡QR descargado desde historial!");
}

// Eliminar item del historial
function eliminarQR(index) {
    let historial = JSON.parse(localStorage.getItem("qrHistorial")) || [];
    historial.splice(index, 1);
    localStorage.setItem("qrHistorial", JSON.stringify(historial));
    mostrarHistorial();
    
    mostrarExito("Elemento eliminado del historial");
}

// Borrar todo el historial
function borrarHistorial() {
    if (confirm("¿Estás seguro de que quieres borrar todo el historial?")) {
        localStorage.removeItem("qrHistorial");
        document.getElementById("historial-list").innerHTML = `<p class="empty-history">No hay elementos en el historial</p>`;
        mostrarExito("Historial borrado completamente");
    }
}

// Exportar historial como JSON
function exportarHistorial() {
    const historial = JSON.parse(localStorage.getItem("qrHistorial")) || [];
    if (historial.length === 0) {
        mostrarError("No hay historial para exportar");
        return;
    }
    
    const dataStr = JSON.stringify(historial, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `qr_historial_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    mostrarExito("Historial exportado como JSON");
}

// Mostrar el último QR generado
function mostrarUltimoQR(historial) {
    const ultimoItem = historial[historial.length - 1];
    currentQR = new QRious({
        element: document.getElementById("qr-canvas"),
        value: ultimoItem.link,
        size: 256,
        level: 'H'
    });
    
    document.getElementById("descargar").style.display = "inline-flex";
    document.getElementById("ver-historial").style.display = "inline-flex";
    document.getElementById("link").value = ultimoItem.link;
}

// Notificaciones
function mostrarError(mensaje) {
    const notificacion = document.createElement("div");
    notificacion.className = "notification error";
    notificacion.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.classList.add("fade-out");
        setTimeout(() => notificacion.remove(), 500);
    }, 3000);
}

function mostrarExito(mensaje) {
    const notificacion = document.createElement("div");
    notificacion.className = "notification success";
    notificacion.innerHTML = `<i class="fas fa-check-circle"></i> ${mensaje}`;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.classList.add("fade-out");
        setTimeout(() => notificacion.remove(), 500);
    }, 3000);
}