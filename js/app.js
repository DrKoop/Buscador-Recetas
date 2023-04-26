function iniciarApp(){

    const resultado = document.querySelector('#resultado');

    const selectCategorias = document.querySelector('#categorias');

    if(selectCategorias){
        selectCategorias.addEventListener("change", seleccionarCategoria);
        obtenerCategorias();
    }

    
    //Mostrando LocalStorage -> HTML
    const favoritosDiv = document.querySelector('.favoritos');
    if( favoritosDiv ){
        obtenerFavoritos();
    }

    
    //Instancia Bootstrap - Modal
    const modal = new bootstrap.Modal('#modal', {});

    

    function obtenerCategorias(){
        const url = "https://www.themealdb.com/api/json/v1/1/categories.php";
        fetch(url)
            .then( respuesta => {
                return respuesta.json()
            })
            .then( resultado => mostrarCategorias(resultado.categories) )
    };

    function mostrarCategorias( categorias = [] ){
        categorias.forEach( e => {
            const option = document.createElement('OPTION');
            option.value = e.strCategory;
            option.textContent = e.strCategory;
            selectCategorias.appendChild(option);
        });
    };

    function seleccionarCategoria(e){
        const categorias = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categorias}`;
        fetch(url)
            .then( respuesta => respuesta.json() )
            .then( resultado => mostrarRecetas(resultado.meals) )
    };

    function mostrarRecetas( recetas = [] ){
        //console.log(recetas)
        limpiarHTML(resultado);


        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black' , 'my-5');
        heading.textContent = recetas.length ? 'Resultados' : 'No hay Resultados';
        resultado.appendChild(heading);
        
        recetas.forEach( receta =>{
            const { idMeal, strMeal, strMealThumb } = receta;

            //console.log(receta)
            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn' , 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';


            recetaButton.onclick = function(){
                seleccionarReceta(idMeal ?? receta.id);
            }

            //Inyectando en el HTML
            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);
            resultado.appendChild(recetaContenedor);
        });
    }

    function seleccionarReceta(id){
        //console.log(id)
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetaModal( resultado.meals[0]) )
    }

    function mostrarRecetaModal( receta ){
        //console.log(receta)
        const { idMeal, strMeal, strInstructions, strMealThumb } = receta;
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');
        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src=${strMealThumb} alt="receta ${strMeal}" />
            <h3 class="my-3">Intrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y Cantidades.</h3>
        `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');

        //Mostrando cantidades, ingredientes , con un arreglo que solo itere , cuando existe un ingrediente
        for(let i = 1; i <= 20; i++ ){
            if(receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent =  `${ingrediente} - ${cantidad}`;
                listGroup.appendChild(ingredienteLi);


                //console.log(`${ingrediente}` - `${cantidad}`)
            }
        }
        modalBody.appendChild(listGroup);
        //
        /* Html conde se inyectara nuestro Html generado con JS */
        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);
        //Botones
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = evitarDuplicados(idMeal) ? 'Eliminar de Mis Favoritos' : 'Guardar Favorito';

        /* -------------------------------------------------------------------------- */
        /*                                LOCALSTORAGE                                */
        /* -------------------------------------------------------------------------- */
        btnFavorito.onclick = function(){
            if( evitarDuplicados(idMeal) ){
                eliminarFavoritos(idMeal);
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado Correctamente');
                return
            }
            //Setteando informacion que vamos a almacenar
            agregarFavorito({
                id : idMeal,
                titulo : strMeal,
                img: strMealThumb
            });
            btnFavorito.textContent = 'Eliminar de Mis Favoritos';
            mostrarToast('Agregado Correctamente');
        }

        /* -------------------------------------------------------------------------- */
        /*                               *LOCALSTORAGE                                */
        /* -------------------------------------------------------------------------- */

        const btnCerrarModal = document.createElement('BUTTON');
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        btnCerrarModal.textContent = 'Cerrar';
        btnCerrarModal.onclick = function(){
            modal.hide();
        }

        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrarModal);

        modal.show();
    }

    //LOCALSTORAGE
    function agregarFavorito(objetoSeteado){
        //Convirtiendo onjeto a un arreglo
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        //Localstorage solo agregar STRINGS
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, objetoSeteado]));
    }

    function eliminarFavoritos(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevoItem = favoritos.filter( favorito => favorito.id !== id);
        //Actualizando localstorage
        localStorage.setItem('favoritos', JSON.stringify(nuevoItem));
    }

    function evitarDuplicados(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some( favorito => favorito.id === id );
    }
    //API Toast - Bootrsap
    function mostrarToast(mensaje){
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;
        toast.show();
    }

    function obtenerFavoritos(){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

        if(favoritos.length){
            mostrarRecetas(favoritos);
            return
        }

        const noHayFavoritos = document.createElement('P');
        noHayFavoritos.textContent = 'No hay Favoritos aún';
        noHayFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        resultado.appendChild(noHayFavoritos);

    }

    //*LOCALSTORAGE

    function limpiarHTML(selector){
        while(selector.firstChild){
            selector.removeChild(selector.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);