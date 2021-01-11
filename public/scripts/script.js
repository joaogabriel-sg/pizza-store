const pagePizzas = document.querySelector('#page-pizzas');
const pizzasContainer = document.querySelector('.pizzas-container');
const likeCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
const currentPizza = {
  pizza: null,
  pizzaId: null,
  pizzaQuantity: 1,
  pizzaPrice: null,
  pizzaSizeId: null,
};

async function getPizzas() {
  return (await fetch('./pizzas.json')).json();
}

async function getPizzaById() {
  const pizzas = await getPizzas();
  const { pizzaId } = currentPizza;
  return pizzas.find(({ id }) => Number(id) === Number(pizzaId));
}

function getCartItemsOnLocalStorage() {
  return JSON.parse(localStorage.getItem('cart'));
}

function setCartItemsOnLocalStorage(items) {
  localStorage.setItem('cart', JSON.stringify(items));
}

function resetPizzaStates() {
  currentPizza.pizza = null;
  currentPizza.pizzaId = null;
  currentPizza.pizzaQuantity = 1;
  currentPizza.pizzaPrice = null;
  currentPizza.pizzaSizeId = null;
}

function addNoScrollBodyClass() {
  document.body.classList.add('no-scroll');
}

function removeNoScrollBodyClass() {
  document.body.classList.remove('no-scroll');
}

function updateCartViewMobileEventAndNumberOfItems() {
  const pizzasCart = getCartItemsOnLocalStorage();
  const pizzaCartViewQuantity = pizzasCart.reduce((acc, { quantity }) => {
    acc += Number(quantity);
    return acc;
  }, 0);

  const cartViewContent = document.querySelector('.cart-view-content');
  cartViewContent.addEventListener('click', openCart);

  const cartViewContentNumber = document.querySelector('.cart-view-content .number-of-items');
  cartViewContentNumber.textContent = pizzaCartViewQuantity;
}

function updateCart() {
  const pizzasCart = getCartItemsOnLocalStorage();
  if (pizzasCart.length === 0) {
    removeNoScrollBodyClass();
    const cartContainer = document.querySelector('.cart-container');
    cartContainer.classList.remove('active');
  }

  const subtotal = pizzasCart.reduce((acc, { totalPrice }) => {
    acc += totalPrice;
    return acc;
  }, 0);
  const discount = subtotal * 0.1;
  const total = subtotal - discount;

  const cartSubtotalContainer = document.querySelector('.cart-subtotal span');
  const cartDiscountContainer = document.querySelector('.cart-discount span');
  const cartTotalContainer = document.querySelector('.cart-total span');
  cartSubtotalContainer.textContent = likeCurrency.format(subtotal);
  cartDiscountContainer.textContent = likeCurrency.format(discount);
  cartTotalContainer.textContent = likeCurrency.format(total);
  updateCartViewMobileEventAndNumberOfItems();
}

function minusItemQuantity(e) {
  let pizzasCart = getCartItemsOnLocalStorage();

  const cartItem = e.currentTarget.parentNode.parentNode;
  const { dataset: { id: itemId, sizeDesc: itemDesc } } = cartItem;
  const cartItemQuantity = cartItem.querySelector('.item-quantity');

  pizzasCart.forEach(({ id, desc }, index) => {
    if (Number(id) === Number(itemId) && desc === itemDesc) {
      pizzasCart[index].quantity -= 1;
      cartItemQuantity.textContent = pizzasCart[index].quantity;
      pizzasCart[index].totalPrice = pizzasCart[index].quantity * pizzasCart[index].price;

      if (pizzasCart[index].quantity < 1) {
        pizzasCart = pizzasCart.filter((_, i) => i !== index);
        cartItem.remove();
      }
    }
  });

  setCartItemsOnLocalStorage(pizzasCart);
  updateCart();
}

function addItemQuantity(e) {
  const pizzasCart = getCartItemsOnLocalStorage();
  const cartItem = e.currentTarget.parentNode.parentNode;
  const { dataset: { id: itemId, sizeDesc: itemDesc } } = cartItem;
  const cartItemQuantity = cartItem.querySelector('.item-quantity');

  pizzasCart.forEach((pizzaItem, index) => {
    if (Number(pizzaItem.id) === Number(itemId) && pizzaItem.desc === itemDesc) {
      pizzasCart[index].quantity += 1;
      pizzasCart[index].totalPrice = pizzasCart[index].quantity * pizzasCart[index].price;
      cartItemQuantity.textContent = pizzasCart[index].quantity;
      setCartItemsOnLocalStorage(pizzasCart);
    }
  });

  updateCart();
}

function addEventsToQuantityInCartItems() {
  const cartItems = document.querySelectorAll('.cart-item');
  cartItems.forEach((cartItem) => {
    const btnAdd = cartItem.querySelector('.quantity-plus');
    btnAdd.addEventListener('click', addItemQuantity);
    const btnMinus = cartItem.querySelector('.quantity-minus');
    btnMinus.addEventListener('click', minusItemQuantity);
  });
}

function closeCart() {
  const cartContainer = document.querySelector('.cart-container');
  cartContainer.classList.remove('active');
  removeNoScrollBodyClass();
  updateCartViewMobileEventAndNumberOfItems();
}

function addCloseCartBtnEvent() {
  const btnCloseCart = document.querySelector('.btn-close-cart i');
  btnCloseCart.addEventListener('click', closeCart);
}

function createCartItemTemplate(acc, item) {
  acc += `
  <div class="cart-item" data-id="${item.id}" data-size-desc="${item.desc}">
    <div class="item-pizza-info-container">
      <img class="item-image" src="${item.img}" alt="${item.name}">
      <h3 class="item-name">${item.name} (${item.desc[0]})</h3>
    </div>
    <div class="item-quantity-container">
      <button class="quantity-minus">
          <i class="fas fa-minus"></i>
      </button>
      <span class="item-quantity">${item.quantity}</span>
      <button class="quantity-plus" >
          <i class="fas fa-plus"></i>
      </button>
    </div>
  </div>
  `;
  return acc;
}

function openCart() {
  addCloseCartBtnEvent();
  if (window.innerWidth <= 768) addNoScrollBodyClass();

  const cartContainer = document.querySelector('.cart-container');
  cartContainer.classList.add('active');

  const pizzasCart = getCartItemsOnLocalStorage();
  const cartList = document.querySelector('.cart-list');
  const cartItems = pizzasCart.reduce(createCartItemTemplate, '');
  cartList.innerHTML = cartItems;

  addEventsToQuantityInCartItems();
  updateCart();
}

function closePizzaModal() {
  const modalContainer = document.querySelector('.modal-container');
  modalContainer.classList.remove('active');
  modalContainer.remove();
  removeNoScrollBodyClass();
  updateCartViewMobileEventAndNumberOfItems();
}

function createOrModifyPizzaItem(pizzasCart, itemIndex) {
  const {
    pizza: { name, img, sizes },
    pizzaId,
    pizzaQuantity,
    pizzaPrice,
    pizzaSizeId,
  } = currentPizza;
  const { desc } = sizes[pizzaSizeId];

  if (itemIndex !== -1) {
    pizzasCart[itemIndex].quantity += pizzaQuantity;
    pizzasCart[itemIndex].totalPrice = pizzasCart[itemIndex].quantity * pizzasCart[itemIndex].price;
  } else {
    pizzasCart.push({
      id: pizzaId,
      name,
      img,
      quantity: pizzaQuantity,
      price: pizzaPrice,
      desc,
      totalPrice: pizzaPrice * pizzaQuantity,
    });
  }
  return pizzasCart;
}

function verifyIfCurrentPizzaExistsInCart(pizzasCart) {
  const { pizza: { sizes }, pizzaId, pizzaSizeId } = currentPizza;
  const { desc: pizzaDesc } = sizes[pizzaSizeId];
  return pizzasCart.findIndex(({ id: pizzaItemId, desc: pizzaItemDesc }) =>
    Number(pizzaItemId) === Number(pizzaId) && pizzaItemDesc === pizzaDesc);
}

function addToCart() {
  const pizzasCart = getCartItemsOnLocalStorage() || [];
  const isThisItemExistent = verifyIfCurrentPizzaExistsInCart(pizzasCart);
  const newPizzasCart = createOrModifyPizzaItem(pizzasCart, isThisItemExistent);
  setCartItemsOnLocalStorage(newPizzasCart);
  closePizzaModal();
  openCart();
}

function updateModalPizzaPrice() {
  const modalPizzaPrice = document.querySelector('.modal-pizza-price');
  const { pizzaPrice, pizzaQuantity } = currentPizza;
  modalPizzaPrice.textContent = likeCurrency.format(pizzaPrice * pizzaQuantity);
}

async function changePriceBasedOnSizeOptionId() {
  try {
    const { pizzaId, pizzaSizeId } = currentPizza;
    const { sizes } = await getPizzaById(pizzaId);
    const { price } = sizes[pizzaSizeId];
    currentPizza.pizzaPrice = price;
    updateModalPizzaPrice();
  } catch (error) {
    if (error) throw new Error(error);
    console.error(error);
  }
}

function subtractModalQuantity() {
  const quantityContainer = document.querySelector('.modal-quantity');
  currentPizza.pizzaQuantity -= 1;
  if (currentPizza.pizzaQuantity < 1) currentPizza.pizzaQuantity = 1;
  quantityContainer.textContent = currentPizza.pizzaQuantity;
  updateModalPizzaPrice();
}

function addModalQuantity() {
  const quantityContainer = document.querySelector('.modal-quantity');
  currentPizza.pizzaQuantity += 1;
  quantityContainer.textContent = currentPizza.pizzaQuantity;
  updateModalPizzaPrice();
}

function removeActiveClassInSizeOptionsOnModal() {
  const modalPizzaSize = document.querySelectorAll('.modal-pizza-size');
  modalPizzaSize.forEach((btnSize) => btnSize.classList.remove('active'));
}

function changeCurrentPizzaSize(e) {
  removeActiveClassInSizeOptionsOnModal();

  const btnCurrentSize = e.currentTarget;
  const { dataset: { sizeId } } = btnCurrentSize;
  btnCurrentSize.classList.add('active');
  currentPizza.pizzaSizeId = sizeId;

  changePriceBasedOnSizeOptionId();
}

function addClickEventForEachSize(size) {
  if (size.classList.contains('active')) changePriceBasedOnSizeOptionId();
  size.addEventListener('click', changeCurrentPizzaSize);
}

function addModalEvents() {
  const modalPizzaSize = document.querySelectorAll('.modal-pizza-size');
  modalPizzaSize.forEach(addClickEventForEachSize);
}

function createPizzaSizesTemplate() {
  const { pizza: { sizes } } = currentPizza;
  const lastSizeIndex = sizes.length - 1;

  return sizes.reduce((acc, { size, desc }, index) => {
    let classes = 'modal-pizza-size';
    if (index === lastSizeIndex) {
      currentPizza.pizzaSizeId = index;
      classes += ' active';
    }
    acc += `
      <button class="${classes}" data-size-id="${index}">
        ${desc} <span>${size}</span>
      </button>
    `;
    return acc;
  }, '');
}

function createModalTemplate() {
  const {
    name, img, description, sizes,
  } = currentPizza.pizza;
  const pizzaSizesHTML = createPizzaSizesTemplate();
  const lastPizzaSizePrice = likeCurrency.format(sizes[sizes.length - 1].price);

  return `
    <div class="modal-container active">
      <div class="modal">
        <span class="btn-close-modal" onclick="closePizzaModal()"><i class="fas fa-arrow-left"></i> Voltar</span>
        <div class="modal-image-container">
          <img src="${img}" alt="${name}" class="modal-pizza-image">
        </div>
        <div class="modal-datas-container">
          <h1 class="modal-pizza-name">${name}</h1>
          <h2 class="modal-pizza-description">${description}</h2>
          <h3 class="modal-subtitle">Tamanho</h3>
          <div class="modal-size-container">
            ${pizzaSizesHTML}
          </div>
          <h3 class="modal-subtitle">Preço</h3>
          <div class="modal-price-quantity-container">
            <h4 class="modal-pizza-price">${lastPizzaSizePrice}</h4>
            <div class="modal-quantity-container">
              <button class="modal-btn-minus" onclick="subtractModalQuantity()"><i class="fas fa-minus"></i></button>
              <span class="modal-quantity">1</span>
              <button class="modal-btn-plus" onclick="addModalQuantity()"><i class="fas fa-plus"></i></button>
            </div>
          </div>
          <div class="modal-buttons-container">
            <button class="modal-btn-add-to-cart" onclick="addToCart()">Adicionar ao carrinho</button>
            <button class="modal-btn-cancel" onclick="closePizzaModal()">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function openPizzaModal(element) {
  try {
    resetPizzaStates();
    currentPizza.pizzaId = element.parentNode.dataset.id;
    currentPizza.pizza = await getPizzaById();

    const modal = createModalTemplate();
    pagePizzas.innerHTML += modal;

    addNoScrollBodyClass();
    addModalEvents();
  } catch (error) {
    if (error) throw new Error(error);
    console.error(error);
  }
}

function createPizzasTemplate(acc, {
  id, name, img, description, sizes,
}) {
  acc += `
    <div class="pizza" data-id="${id}">
      <div class="pizza-image-container">
        <img src="${img}" alt="${name}" class="pizza-image">
      </div>
      <button class="btn-add-pizza" onclick="openPizzaModal(this)"><i class="fas fa-plus"></i></button>
      <h3 class="pizza-price">${likeCurrency.format(sizes[sizes.length - 1].price)}</h3>
      <h2 class="pizza-name">${name}</h2>
      <p class="pizza-description">${description}</p>
    </div>
  `;
  return acc;
}

function verifyIfExistsPizzasInCart() {
  const pizzasCart = JSON.parse(localStorage.getItem('cart'));
  if (pizzasCart) openCart();
}

async function insertPizzasIntoDOM() {
  try {
    const pizzas = await getPizzas();
    const pizzasTemplate = pizzas.reduce(createPizzasTemplate, '');
    pizzasContainer.innerHTML = pizzasTemplate;
    verifyIfExistsPizzasInCart();
  } catch (error) {
    if (error) throw new Error(error);
    console.error(error);
  }
}

function whenResizeTheWindow() {
  const cartContainer = document.querySelector('.cart-container');

  if (window.innerWidth > 768) {
    verifyIfExistsPizzasInCart();
    removeNoScrollBodyClass();
  } else if (window.innerWidth <= 768
    && cartContainer.classList.contains('active')) {
    openCart();
    addNoScrollBodyClass();
  }
}

insertPizzasIntoDOM();

window.addEventListener('resize', whenResizeTheWindow);
