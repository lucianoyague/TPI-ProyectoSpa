document.addEventListener("DOMContentLoaded", () => {
    const metodoPagoRadios = document.querySelectorAll("input[name='metodo-pago']");
    const efectivoInfo = document.getElementById("efectivo-info");
    const transferenciaInfo = document.getElementById("transferencia-info");
    const urlParams = new URLSearchParams(window.location.search);
    const fecha = urlParams.get("fecha");
    const hora = urlParams.get("hora");
    const servicios = JSON.parse(urlParams.get("servicios") || "[]").map(servicio => parseInt(servicio)); // Asegurarse de que sean números
    const duracionTotal = urlParams.get("duracionTotal");
    const precioTotal = urlParams.get("precioTotal");

    console.log({ fecha, hora, servicios, duracionTotal, precioTotal });

    // Validar que los servicios sean válidos
    if (servicios.some(servicio => isNaN(servicio))) {
        showToastError("Error: Los servicios seleccionados no son válidos.");
        return;
    }

    metodoPagoRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.value === "efectivo") {
                efectivoInfo.style.display = "block";
                transferenciaInfo.style.display = "none";
            } else if (radio.value === "transferencia") {
                efectivoInfo.style.display = "none";
                transferenciaInfo.style.display = "block";
            }
        });
    });

    // Mostrar los datos en el resumen
    document.getElementById("resumen-fecha").textContent = fecha || "No seleccionada";
    document.getElementById("resumen-hora").textContent = hora || "No seleccionada";
    const resumenServicios = document.getElementById("resumen-servicios");
    servicios.forEach(servicio => {
        const li = document.createElement("li");
        li.textContent = `Servicio ID: ${servicio}`;
        resumenServicios.appendChild(li);
    });
    document.getElementById("resumen-duracion").textContent = duracionTotal || "0";
    document.getElementById("resumen-precio").textContent = precioTotal || "0";

    // Enviar el formulario
    const contactoForm = document.getElementById("contacto-form");
    contactoForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactoForm);
        const cliente = {
            nombre: formData.get("nombre"),
            apellido: formData.get("apellido"),
            telefono: formData.get("telefono"),
            nacionalidad: formData.get("nacionalidad"),
            dni: formData.get("dni"),
            email: formData.get("correo"),
            comentario: formData.get("comentario") || "",
        };

        const turno = {
            fecha,
            hora,
            servicios: servicios.map(servicio => parseInt(servicio)), // Convertir a números
            duracionTotal: parseInt(duracionTotal),
            precioTotal: parseFloat(precioTotal),
            metodoPago: formData.get("metodo-pago"),
        };

        try {
            const response = await fetch("http://localhost:3000/api/turnos/reservas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cliente, turno }),
            });

            if (response.ok) {
                showToastError("Reserva confirmada. Recibirás un correo con los detalles.");
                window.location.href = "index.html";
            } else {
                const errorData = await response.json();
                showToastError(`Error al confirmar la reserva: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error al enviar los datos:", error);
            showToastError("Ocurrió un error al confirmar la reserva. Por favor, inténtalo nuevamente.");
        }
    });
});
function showToastError(message) {
    const toast = document.getElementById("toast-error");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}
