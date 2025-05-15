document.addEventListener("DOMContentLoaded", () => {
    // Verificación de token
    const token = localStorage.getItem("token");
    if (!token) {
        alert("No tienes permiso para acceder a esta página.");
        window.location.href = "login.html";
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload) {
            throw new Error("Token inválido");
        }
    } catch (error) {
        alert("Error de autenticación: " + error.message);
        window.location.href = "login.html";
        return;
    }

    // Elementos del DOM
    const serviceFormContainer = document.getElementById("service-form-container");
    const serviceForm = document.getElementById("service-form");
    const formTitle = document.getElementById("service-form-title");

    // Mostrar formulario para añadir servicio
    document.getElementById("add-service").addEventListener("click", () => {
        formTitle.textContent = "Añadir Servicio";
        serviceForm.dataset.action = "add";
        serviceForm.reset();
        document.getElementById("descripcion").value = ""; // Asegurar campo limpio
        serviceFormContainer.classList.remove("hidden");
    });

    // Editar servicio existente
    document.getElementById("edit-service").addEventListener("click", async () => {
        const serviceId = prompt("Ingrese el ID del servicio que desea editar:");
        if (!serviceId || isNaN(serviceId)) {
            alert("Debe ingresar un ID válido");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/servicios/${serviceId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al obtener el servicio");
            }

            const serviceData = await response.json();
            
            // Rellenar formulario con datos existentes
            formTitle.textContent = "Editar Servicio";
            serviceForm.dataset.action = "edit";
            serviceForm.dataset.serviceId = serviceId;
            document.getElementById("nombre").value = serviceData.nombre;
            document.getElementById("descripcion").value = serviceData.descripcion || "Sin descripción"; // Asegurar descripción
            document.getElementById("duracion").value = serviceData.duracion;
            document.getElementById("precio").value = serviceData.precio;
            document.getElementById("categoria").value = serviceData.categoria;
            
            serviceFormContainer.classList.remove("hidden");

        } catch (error) {
            console.error("Error al obtener el servicio:", error);
            alert(`Error: ${error.message}`);
        }
    });

    // Envío del formulario de servicio
    serviceForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Obtener valores del formulario
        const nombre = document.getElementById("nombre").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim() || "Sin descripción"; // Valor por defecto
        const duracion = parseInt(document.getElementById("duracion").value);
        const precio = parseFloat(document.getElementById("precio").value);
        const categoria = document.getElementById("categoria").value;

        // Validaciones básicas
        if (!nombre || nombre.length < 3) {
            alert("El nombre debe tener al menos 3 caracteres");
            return;
        }

        if (isNaN(duracion) || duracion <= 0) {
            alert("La duración debe ser un número positivo");
            return;
        }

        if (isNaN(precio) || precio <= 0) {
            alert("El precio debe ser un número positivo");
            return;
        }

        if (!categoria) {
            alert("Debe seleccionar una categoría");
            return;
        }

        // Preparar datos para enviar
        const serviceData = { 
            nombre, 
            descripcion, // Incluir descripción siempre
            duracion, 
            precio, 
            categoria 
        };

        // Determinar si es creación o edición
        const action = serviceForm.dataset.action;
        const serviceId = serviceForm.dataset.serviceId;
        let url = "http://localhost:3000/api/servicios";
        let method = "POST";

        if (action === "edit") {
            url += `/${serviceId}`;
            method = "PUT";
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(serviceData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al procesar el servicio");
            }

            const result = await response.json();
            alert(result.message || "Operación realizada con éxito.");
            serviceForm.reset();
            serviceFormContainer.classList.add("hidden");
            
            // Opcional: Recargar lista de servicios si la tienes
            // loadServices(); 

        } catch (error) {
            console.error("Error completo:", {
                error: error,
                serviceData: serviceData,
                timestamp: new Date().toISOString()
            });
            
            let errorMessage = "Error al procesar el servicio";
            if (error.message.includes("ER_BAD_NULL_ERROR")) {
                errorMessage = "Faltan campos obligatorios. Por favor complete todos los campos.";
            } else if (error.message.includes("ER_DUP_ENTRY")) {
                errorMessage = "Ya existe un servicio con ese nombre.";
            }
            
            alert(errorMessage);
        }
    });

    // Cancelar formulario
    document.getElementById("cancel-service").addEventListener("click", () => {
        serviceForm.reset();
        serviceFormContainer.classList.add("hidden");
    });

    // Eliminar servicio
    document.getElementById("delete-service").addEventListener("click", async () => {
        const serviceId = prompt("Ingrese el ID del servicio que desea eliminar:");
        if (!serviceId || isNaN(serviceId)) {
            alert("ID no válido");
            return;
        }

        if (!confirm(`¿Está seguro que desea eliminar el servicio con ID ${serviceId}?`)) return;

        try {
            const response = await fetch(`http://localhost:3000/api/servicios/${serviceId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al eliminar el servicio");
            }

            const result = await response.json();
            alert(result.message || "Servicio eliminado exitosamente");
        } catch (error) {
            console.error("Error al eliminar servicio:", error);
            alert(`Error: ${error.message}`);
        }
    });

    // Gestión de Combos
const comboFormContainer = document.getElementById("combo-form-container");
const comboForm = document.getElementById("combo-form");
const comboFormTitle = document.getElementById("combo-form-title");

document.getElementById("add-combo").addEventListener("click", () => {
    comboFormTitle.textContent = "Añadir Combo";
    comboForm.dataset.action = "add";
    comboForm.reset();
    comboFormContainer.classList.remove("hidden");
});

document.getElementById("edit-combo").addEventListener("click", async () => {
    const comboId = prompt("Ingrese el ID del combo que desea editar:");
    if (!comboId || isNaN(comboId)) {
        alert("Debe ingresar un ID válido");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/combos/${comboId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Error al obtener el combo");

        const comboData = await response.json();
        comboFormTitle.textContent = "Editar Combo";
        comboForm.dataset.action = "edit";
        comboForm.dataset.comboId = comboId;
        document.getElementById("combo-nombre").value = comboData.nombre;
        document.getElementById("combo-descripcion").value = comboData.descripcion || "";
        document.getElementById("combo-precio").value = comboData.precio_total;
        document.getElementById("combo-servicios").value = comboData.servicios.map(s => s.id_servicio).join(", ");
        comboFormContainer.classList.remove("hidden");

    } catch (error) {
        console.error("Error al obtener el combo:", error);
        alert(`Error: ${error.message}`);
    }
});

comboForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("combo-nombre").value.trim();
    const descripcion = document.getElementById("combo-descripcion").value.trim() || "Sin descripción";
    const precio = parseFloat(document.getElementById("combo-precio").value);
    const serviciosInput = document.getElementById("combo-servicios").value.trim();

    if (!nombre || isNaN(precio) || !serviciosInput) {
        alert("Por favor, complete todos los campos correctamente.");
        return;
    }

    const servicios = serviciosInput.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    const comboData = {
        nombre,
        descripcion,
        precio_total: precio,
        servicios
    };

    const action = comboForm.dataset.action;
    const comboId = comboForm.dataset.comboId;

    let url = "http://localhost:3000/api/combos";
    let method = "POST";

    if (action === "edit") {
        url += `/${comboId}`;
        method = "PUT";
    }

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(comboData)
        });

        if (!response.ok) throw new Error("Error al procesar el combo");

        const data = await response.json();
        alert(data.message || "Operación realizada con éxito.");
        comboForm.reset();
        comboFormContainer.classList.add("hidden");
    } catch (error) {
        console.error("Error al procesar el combo:", error);
        alert(`Error: ${error.message}`);
    }
});

document.getElementById("cancel-combo").addEventListener("click", () => {
    comboForm.reset();
    comboFormContainer.classList.add("hidden");
});

document.getElementById("delete-combo").addEventListener("click", async () => {
    const comboId = prompt("Ingrese el ID del combo que desea eliminar:");
    if (!comboId || isNaN(comboId)) {
        alert("ID no válido");
        return;
    }

    if (!confirm(`¿Está seguro que desea eliminar el combo con ID ${comboId}?`)) return;

    try {
        const response = await fetch(`http://localhost:3000/api/combos/${comboId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Error al eliminar el combo");

        alert("Combo eliminado exitosamente");
    } catch (error) {
        console.error("Error al eliminar combo:", error);
        alert(`Error: ${error.message}`);
    }
});
    // Generar código de invitación
    document.getElementById("generate-code-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (!email || !email.includes("@")) {
            alert("Por favor, ingresa un correo electrónico válido.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/admin/generate-and-send-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al generar el código");
            }

            const data = await response.json();
            alert(data.message || "Código generado y enviado exitosamente.");
            document.getElementById("email").value = ""; // Limpiar campo
        } catch (error) {
            console.error("Error al generar código:", error);
            alert(`Error: ${error.message}`);
        }
    });

    // Cerrar sesión
    document.getElementById("logout-button").addEventListener("click", () => {
        if (confirm("¿Está seguro que desea cerrar sesión?")) {
            localStorage.removeItem("token");
            window.location.href = "index.html";
        }
    });
});