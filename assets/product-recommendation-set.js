document.addEventListener("DOMContentLoaded", async function () {
  try {
    const skus = window.skus.split(',');
    const secondProductSku = skus[0];
    const thirdProductSku = skus[1] || null;

    const secondProductContainer = document.getElementById('second-product-container');
    const thirdProductContainer = thirdProductSku ? document.getElementById('third-product-container') : null;
    const setTotalContainer = document.getElementById('set-total-container');

    // Produkte laden
    const response = await fetch('/products.json');
    const { products } = await response.json();

    // Hilfsfunktionen
    const formatPrice = (price) => price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const findProductBySku = (sku) => {
      return products.find(product =>
        product.variants.some(variant => variant.sku === sku)
      );
    };

    const getVariantImage = (variant, product) => {
      return variant?.featured_image?.src || product.images[0]?.src || 'https://via.placeholder.com/300';
    };

    let firstProductPrice = parseFloat(window.firstProductPrice);
    let secondProductPrice = 0;
    let thirdProductPrice = 0;
    let selectedSecondVariant = null;
    let selectedThirdVariant = null;

    // Funktion zur Aktualisierung des Produkts
    const updateProductDisplay = (container, product, variant, priceSetter, updateFunction) => {
      const productImage = getVariantImage(variant, product);
      const productPrice = parseFloat(variant.price) || 0;

      // Preis aktualisieren
      priceSetter(productPrice);

      // Prüfen, ob das Produkt nur eine Variante hat
      const hasMultipleVariants = product.variants.length > 1;

      // Produktanzeige aktualisieren
      container.innerHTML = 
        <a href="/products/${product.handle}" target="_blank">
          <img src="${productImage}" alt="${product.title}" class="product-image" id="product-image-${product.handle}">
        </a>
        <p class="set-item-title">${product.title}</p>
        <p class="set-item-price-current" id="product-price-${product.handle}">${formatPrice(productPrice)} zł</p>
        ${
          hasMultipleVariants
            ? <select id="variant-selector-${product.handle}" class="variant-selector">
                 ${product.variants.map(v => <option value="${v.sku}" ${v.sku === variant.sku ? 'selected' : ''}>${v.title}</option>).join('')}
               </select>
            : ''
        }
      ;

      // Event-Listener für Variantenauswahl (nur bei mehreren Varianten)
      if (hasMultipleVariants) {
        document.getElementById(variant-selector-${product.handle}).addEventListener('change', (e) => {
          const selectedSku = e.target.value;
          const selectedVariant = product.variants.find(v => v.sku === selectedSku);

          // Bild und Preis aktualisieren
          const updatedImage = getVariantImage(selectedVariant, product);
          const updatedPrice = parseFloat(selectedVariant.price) || 0;

          document.getElementById(product-image-${product.handle}).src = updatedImage;
          document.getElementById(product-price-${product.handle}).innerText = ${formatPrice(updatedPrice)} zł;

          // Callback für die ausgewählte Variante
          updateFunction(selectedVariant);
          calculateTotalPrice(); // Gesamtsumme neu berechnen
        });
      }
    };

    // Zweites Produkt laden
    const secondProduct = findProductBySku(secondProductSku);
    if (secondProduct) {
      selectedSecondVariant = secondProduct.variants.find(v => v.sku === secondProductSku);
      updateProductDisplay(secondProductContainer, secondProduct, selectedSecondVariant, (price) => secondProductPrice = price, (variant) => {
        selectedSecondVariant = variant;
      });
    } else {
      secondProductContainer.style.display = 'none';
    }

    // Drittes Produkt laden
    if (thirdProductSku) {
      const thirdProduct = findProductBySku(thirdProductSku);
      if (thirdProduct) {
        selectedThirdVariant = thirdProduct.variants.find(v => v.sku === thirdProductSku);
        updateProductDisplay(thirdProductContainer, thirdProduct, selectedThirdVariant, (price) => thirdProductPrice = price, (variant) => {
          selectedThirdVariant = variant;
        });
      } else {
        thirdProductContainer.style.display = 'none';
      }
    }

    // Gesamtsumme berechnen
    const calculateTotalPrice = () => {
      const totalPrice = firstProductPrice + secondProductPrice + thirdProductPrice;
      setTotalContainer.innerHTML = 
        <p class="set-total-original-price">
          <span style="font-weight: bold;">${formatPrice(totalPrice)} €</span>
        </p>
        <button id="add-set-to-cart" class="btn btn-primary"><span style="color: white;">&#128722; Set kaufen</span></button>
      ;

      document.getElementById('add-set-to-cart').addEventListener('click', async function () {
        const items = [
          { id: window.firstProductId, quantity: 1 },
          { id: selectedSecondVariant.id, quantity: 1 },
          ...(selectedThirdVariant ? [{ id: selectedThirdVariant.id, quantity: 1 }] : [])
        ];

        try {
          const cartResponse = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
          });

          if (!cartResponse.ok) throw new Error('Fehler beim Hinzufügen zum Warenkorb.');
          window.location.href = '/cart';
        } catch (err) {
          alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
      });
    };

    calculateTotalPrice();
  } catch (error) {
    console.error('Fehler:', error);
    alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
  }
});