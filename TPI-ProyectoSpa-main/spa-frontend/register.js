document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const telefono = document.getElementById("telefono").value;
    const contraseña = document.getElementById("contraseña").value;
    const codigoInvitacion = document.getElementById("codigo-invitacion").value;

    try {
        const response = await fetch("http://localhost:3000/api/admin/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nombre, apellido, email, telefono, contraseña, codigoInvitacion }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("token", data.token); // Guardar el token en localStorage
            alert("Administrador registrado exitosamente.");
            window.location.href = "admin.html"; // Redirigir al panel de administración
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Ocurrió un error al registrar el administrador.");
    }
});