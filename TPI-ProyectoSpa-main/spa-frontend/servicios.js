document.addEventListener("DOMContentLoaded", async () => {
    const serviciosIndividualesContainer = document.getElementById("servicios-individuales");
    const serviciosGrupalesContainer = document.getElementById("servicios-grupales");
    const combosContainer = document.getElementById("combos-container");

    // Configuración de imágenes y descripciones por categoría
    const categoriasConfig = {
        "Masajes": { imagen: "masajes.jpeg", descripcion: "Relájate con nuestros masajes diseñados para aliviar el estrés y mejorar tu bienestar." },
        "Belleza": { imagen: "belleza.jpeg", descripcion: "Realza tu belleza natural con nuestros tratamientos personalizados." },
        "Tratamientos Faciales": { imagen: "facial.jpeg", descripcion: "Rejuvenece tu piel con nuestras terapias faciales y productos naturales." },
        "Tratamientos Corporales": { imagen: "corporales.jpeg", descripcion: "Disfruta de tratamientos avanzados para moldear tu cuerpo." },
        "Servicios Grupales": { imagen: "default-grupal.jpg", descripcion: "Disfruta de nuestros servicios grupales exclusivos." }
    };

    // Imágenes específicas para servicios grupales conocidos
    const imagenesGrupales = {
        "Hidromasajes": "hidromasaje.jpg",
        "Yoga": "yoga.jpeg"
    };

    async function fetchServicios() {
        try {
            const response = await fetch("http://localhost:3000/api/servicios");
            if (!response.ok) throw new Error("Error al cargar servicios");
            const servicios = await response.json();
            organizarServicios(servicios);
        } catch (error) {
            console.error("Error:", error);
            serviciosIndividualesContainer.innerHTML = `<p class="error">${error.message}</p>`;
            serviciosGrupalesContainer.innerHTML = "";
        }
    }

    function organizarServicios(servicios) {
        serviciosIndividualesContainer.innerHTML = "";
        serviciosGrupalesContainer.innerHTML = "";

        const { individuales, grupales } = servicios.reduce((acc, servicio) => {
            if (servicio.categoria === "Servicios Grupales") {
                acc.grupales.push(servicio);
            } else {
                if (!acc.individuales[servicio.categoria]) {
                    acc.individuales[servicio.categoria] = [];
                }
                acc.individuales[servicio.categoria].push(servicio);
            }
            return acc;
        }, { individuales: {}, grupales: [] });

        for (const [categoria, servicios] of Object.entries(individuales)) {
            const config = categoriasConfig[categoria] || {};
            serviciosIndividualesContainer.appendChild(
                crearCajaServicioIndividual(categoria, servicios, config)
            );
        }

        grupales.forEach(servicio => {
            const imagen = imagenesGrupales[servicio.nombre] || categoriasConfig["Servicios Grupales"].imagen;
            const descripcion = servicio.descripcion || categoriasConfig["Servicios Grupales"].descripcion;
            
            serviciosGrupalesContainer.appendChild(
                crearCajaServicioGrupal(servicio.nombre, servicio, imagen, descripcion)
            );
        });
    }

    function crearCajaServicioIndividual(categoria, servicios, config) {
        const serviceBox = document.createElement("div");
        serviceBox.classList.add("service-box");
        serviceBox.innerHTML = `
            <img src="images/${config.imagen}" alt="${categoria}">
            <h3>${categoria}</h3>
            <p>${config.descripcion}</p>
            <ul>
                ${servicios.map(s => {
                    const precio = parseFloat(s.precio) || 0;
                    return `<li><strong>${s.nombre}:</strong> $${precio.toFixed(2)} - ${s.duracion} min</li>`;
                }).join("")}
            </ul>
        `;
        return serviceBox;
    }

    function crearCajaServicioGrupal(nombreServicio, servicio, imagen, descripcion) {
        const serviceBox = document.createElement("div");
        serviceBox.classList.add("combo-box"); // Cambiamos a la clase combo-box
        
        serviceBox.innerHTML = `
            <img src="images/${imagen}" alt="${nombreServicio}" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="text-align: center;">${nombreServicio}</h3>
            <p style="text-align: center;">${descripcion}</p>
            <div class="service-details" style="text-align: center;">
                <p><strong>Precio:</strong> $${parseFloat(servicio.precio).toFixed(2)}</p>
                <p><strong>Duración:</strong> ${servicio.duracion} min</p>
            </div>
        `;
        return serviceBox;
    }

    async function fetchCombos() {
        try {
            const response = await fetch("http://localhost:3000/api/combos");
            if (!response.ok) throw new Error("Error al cargar combos");
            const combos = await response.json();
            mostrarCombos(combos);
        } catch (error) {
            console.error("Error:", error);
            combosContainer.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    function mostrarCombos(combos) {
        combosContainer.innerHTML = "";
        combos.forEach(combo => {
            const precio = parseFloat(combo.precio_total) || 0;
            const comboBox = document.createElement("div");
            comboBox.classList.add("combo-box");
            
            // Calcular ahorro total si es aplicable
            let ahorroTotal = 0;
            if (combo.servicios && combo.servicios.length > 0) {
                const totalIndividual = combo.servicios.reduce((sum, servicio) => {
                    return sum + (parseFloat(servicio.precio) || 0);
                }, 0);
                ahorroTotal = totalIndividual - precio;
            }
            
            comboBox.innerHTML = `
                <h3 style="text-align: center;">${combo.nombre}</h3>
                <p style="text-align: center;">${combo.descripcion}</p>
                <div class="service-details" style="text-align: center;">
                    <p><strong>Precio total:</strong> $${precio.toFixed(2)}</p>
                    ${ahorroTotal > 0 ? `<p class="savings"><strong>Ahorras:</strong> $${ahorroTotal.toFixed(2)}</p>` : ''}
                </div>
                <p style="text-align: left; font-weight: bold; margin-top: 15px;">Incluye:</p>
                <ul>
                    ${combo.servicios.map(s => {
                        const precioServicio = parseFloat(s.precio) || 0;
                        const duracion = parseInt(s.duracion) || 0;
                        return `<li><strong>${s.nombre}:</strong> $${precioServicio.toFixed(2)} - ${duracion} min</li>`;
                    }).join("")}
                </ul>
            `;
            combosContainer.appendChild(comboBox);
        });
    }

    await fetchServicios();
    await fetchCombos();
});