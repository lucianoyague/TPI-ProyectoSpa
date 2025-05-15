document.addEventListener("DOMContentLoaded", async () => {
    const serviceListContainer = document.getElementById("turnos-servicios-list");
    const precioTotalElement = document.getElementById("resumen-precio");
    const duracionTotalElement = document.getElementById("resumen-duracion");
    const resumenServicios = document.getElementById("resumen-servicios");
    const noServiciosTexto = document.createElement("li");
    noServiciosTexto.textContent = "No has seleccionado servicios aún.";
    resumenServicios.appendChild(noServiciosTexto);

    const fechaInput = document.getElementById("fecha");
    const horaInput = document.getElementById("hora");
    const resumenFecha = document.getElementById("resumen-fecha");
    const resumenHora = document.getElementById("resumen-hora");
    const continuarBtn = document.getElementById("continuar-btn");

    const maxDuracion = 240; // Máximo de 4 horas (240 minutos)
    let duracionTotal = 0;
    let precioTotal = 0;

    // Actualizar fecha y hora en el resumen
    fechaInput.addEventListener("change", () => {
        resumenFecha.textContent = fechaInput.value || "No seleccionada";
    });

    horaInput.addEventListener("change", () => {
        resumenHora.textContent = horaInput.value || "No seleccionada";
    });

    // Función para obtener los servicios desde el backend
    async function fetchServicios() {
        try {
            const response = await fetch("http://localhost:3000/api/servicios");
            if (!response.ok) {
                throw new Error("Error al obtener los servicios");
            }
            const servicios = await response.json();
            console.log("Servicios obtenidos:", servicios); // Imprimir los datos en la consola
            renderServicios(servicios);
        } catch (error) {
            console.error("Error al cargar los servicios:", error);
            serviceListContainer.innerHTML = "<p>Error al cargar los servicios. Intenta nuevamente más tarde.</p>";
        }
    }

    // Función para renderizar los servicios en el DOM
    function renderServicios(servicios) {
        serviceListContainer.innerHTML = ""; // Limpiar el contenedor
    
        const categorias = {};
    
        // Clasificar los servicios por categoría
        servicios.forEach(servicio => {
            if (!categorias[servicio.categoria]) {
                categorias[servicio.categoria] = [];
            }
            categorias[servicio.categoria].push(servicio);
        });
    
        // Renderizar cada categoría
        for (const [categoria, servicios] of Object.entries(categorias)) {
            const categoryTitle = document.createElement("h3");
            categoryTitle.textContent = categoria;
            serviceListContainer.appendChild(categoryTitle);
    
            servicios.forEach(servicio => {
                const precio = parseFloat(servicio.precio); // Convertir a número
                const serviceButton = document.createElement("div");
                serviceButton.classList.add("service-button");
                serviceButton.setAttribute("data-id", servicio.id_servicio);
                serviceButton.setAttribute("data-duracion", servicio.duracion);
                serviceButton.setAttribute("data-precio", precio);
                serviceButton.textContent = `${servicio.nombre} (${servicio.duracion} min - $${precio.toFixed(2)})`;
                serviceListContainer.appendChild(serviceButton);
            });
        }
    
        // Reasignar eventos a los botones de servicios
        assignServiceButtonEvents();
    }

    // Función para asignar eventos a los botones de servicios
    function assignServiceButtonEvents() {
        const serviceButtons = document.querySelectorAll(".service-button");
        serviceButtons.forEach(button => {
            button.addEventListener("click", () => {
                const duracion = parseInt(button.dataset.duracion);
                const precio = parseFloat(button.dataset.precio);
                const idServicio = parseInt(button.dataset.id);

                if (button.classList.contains("selected")) {
                    button.classList.remove("selected");
                    duracionTotal -= duracion;
                    precioTotal -= precio;
                    const servicio = resumenServicios.querySelector(`[data-id="${idServicio}"]`);
                    if (servicio) servicio.remove();
                } else {
                    if (duracionTotal + duracion > maxDuracion) {
                        showToastError("No puedes seleccionar más servicios. Excedes el tiempo máximo permitido (4 horas).");
                    return;
                    }
                    button.classList.add("selected");
                    duracionTotal += duracion;
                    precioTotal += precio;

                    const li = document.createElement("li");
                    li.textContent = `${button.textContent}`;
                    li.setAttribute("data-id", idServicio);
                    resumenServicios.appendChild(li);
                }

                if (resumenServicios.querySelectorAll("li[data-id]").length === 0) {
                    if (!resumenServicios.contains(noServiciosTexto)) {
                        resumenServicios.appendChild(noServiciosTexto);
                    }
                } else {
                    if (resumenServicios.contains(noServiciosTexto)) {
                        noServiciosTexto.remove();
                    }
                }

                duracionTotalElement.textContent = duracionTotal;
                precioTotalElement.textContent = precioTotal.toFixed(2);
            });
        });
    }

    // Redirigir al formulario de contacto
    continuarBtn.addEventListener("click", () => {
        const fecha = fechaInput.value;
        const hora = horaInput.value;
        const servicios = Array.from(resumenServicios.querySelectorAll("li[data-id]")).map(li => parseInt(li.getAttribute("data-id"))); // Capturar data-id como número
        const duracionTotal = duracionTotalElement.textContent;
        const precioTotal = precioTotalElement.textContent;

        if (!fecha || !hora || servicios.length === 0) {
            alert("Por favor, completa todos los campos y selecciona al menos un servicio antes de continuar.");
            return;
        }

        const queryParams = new URLSearchParams({
            fecha,
            hora,
            servicios: JSON.stringify(servicios), // Enviar los id_servicio
            duracionTotal,
            precioTotal
        });
        window.location.href = `contacto.html?${queryParams.toString()}`;
    });

    // Llamar a la función para cargar los servicios
    fetchServicios();
});

function showToastError(message) {
    const toast = document.getElementById("toast-error");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}
