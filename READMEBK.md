TRASCENDER
==========

Framework basado en ExpressJS para construir aplicaciones web. Contiene los siguientes módulos predefinidos:

- Motor de plantillas
- Enrutamiento
- Demo de backend
- Configuración de propiedades
- Frontend simple
- Blog
- Catálogo de productos
- Carro de cotización
- Sistema de usuarios
- Chat
- Sistema de archivos públicos
- Sistema de archivos privados
- Sistema de mailing
- Sistema de mailing

ESTO ES DE OTRO FRAMEWORK!! NO SEGUIR LEYENDO

Contiene motor de plantillas, authenticacionEste **framework** tiene como objetivo volver a lo esencial, sólo necesitas saber HTML y unas pocas sintaxis para renderizar tu contenido de manera simple.

----------

Integrando a tu aplicación express
-------------

    //import template library
    var template = require(__dirname + "/lib/transcend");
    
    //instance library with html path to internal logic
    var engine = new template(__dirname + "/src/html");
    
    //define engine transcend with transcend library
    app.engine("html", function (filePath, data, callback) {
    	fs.readFile(filePath, function (err, content) {
    		if (err) return callback(new Error(err));
    		return callback(null, engine.processTemplate(content.toString(),data));
    	});
    });
    //set directory of views to express
    app.set("views", __dirname + "/src/html");
    //set motor of template to express
    app.set("view engine", "html");

Plantillas maestras
-------------

Este motor utiliza plantillas maestras almacenadas dentro de ```/html/master/```.

Las plantillas maestras tienen sintaxis HTML, pero además permite definir espacios dinámicos con ```<<define:namespace>>``` en cualquier parte del código.

Subplantillas
-------------

Este motor permite dividir el contenido en subplantillas, las cuales deberán almacenarse en ```/html/include/``` y deberan invocarse con el código ```<<include:name.html>> ```en cualquier parte del HTML e incluso desde otra subplantilla.

Renderizando vistas
-------------

Para indicar la plantilla maestra que utilizará la vista se debe incluir ```<<use:mastername>>``` en la parte superior del archivo html.

Para indicar el contenido dinámico de una sección en particular se debe incluir entre ```<<nasmespace>> y <</nasmespace>>```.

Control data
-------------

Para hacer referencia a un dato en particular se debe usar ```<<data:doc:fieldname>>``` en la parte donde se quiera incluir.

Control repeat
-------------
Para los objetos tipo lista se deberá incluir el contenido dentro de ```<<repeat:doc.fieldname>>``` y ```<</repeat:doc.fieldname>>``` e incluir dentro el html correspondiente y los datos haciendo referencia al indice como ```<<data:doc.fieldnamelist[index]>>```. Esta opción permite tener listas de valores y listas de objetos.

Control subrepeat
-------------
Además en caso de haber una lista con sublista, se podrá utilizar el código ```<<subrepeat:doc.fieldnamelist[index].fieldnamesublist>>``` y hacer referencia al valor con el indice index2.

Control if
-------------
Cuando se quiera renderizar un contenido en base a una operación booleana se deberá crear el contenido correspondiente entre los tag ```<<if:doc.fieldname>> y <</if>>```.

