import React, { useEffect, useState } from "react";
import "./styles/TaomlarSoz.css";
import axios from "axios";

export default function TaomlarSoz() {
  const [menu, setMenu] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [dishes, setDishes] = useState({
    name: "",
    time: "",
    price: "",
    image: "",
    category: "Hammasi", 
  });
  const [productName,setProductNAme]=useState('')
  const [productImage,setProductImage]=useState(null)
  const [productPrice,setProductPrice]=useState('')
  const [productCategoryID,setProductCategoryId]=useState(8)


  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Hammasi");

  const fetchMenu = () => {
    try {
      axios("http://109.172.37.41:4000/product")
        .then((res) => {
          console.log("Ma'lumot:", res.data);
          setMenu(res.data);
        });
    } catch (error) {
      console.error("Menyuni olishda xato:", error);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddDish = () => {
    // if (!productName || !productPrice || !productImage || !productCategoryID) {
    //   alert("Iltimos, barcha maydonlarni to'ldiring.");
    //   return;
    // }

    // Ensure valid category is selected
    if (!dishes.category) {
      setDishes((prevState) => ({
        ...prevState,
        category: "Hammasi", // default fallback category
      }));
    }

    if (editing) {
      axios.put(`http://109.172.37.41:4000/product/${dishes.id}`, dishes)
        .then(() => {
          fetchMenu();
          setEditing(false);
        });
    } else {

    const formdata= new FormData()
    formdata.append('name',productName)
    formdata.append('price',parseInt(productPrice))
    formdata.append('image',productImage)
    formdata.append('orderId',2)
    console.log(productImage);
    
      axios.post("http://109.172.37.41:4000/product", formdata)
        .then(() => fetchMenu());
    }

    // setDishes({
    //   name: "",
    //   price: "",
    //   image: "",
    //   time: "",
    //   category: "Hammasi", // default category
    // });
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Taomini o'chirishni istaysizmi?")) {
      axios.delete(`http://109.172.37.41:4000/product/${id}`)
        .then(() => fetchMenu());
    }
  };

  const handleEdit = (dish) => {
    setDishes(dish);
    setEditing(true);
    setShowModal(true);
  };

  const categories = [
    "Hammasi",
    "Asosiy Taom",
    "Sho'rva",
    "Salatlar",
    "Zakuska",
    "Ichimlik",
    "Shirin"
  ];

  const filteredMenu =
    selectedCategory === "Hammasi"
      ? menu
      : menu.filter((item) => item.category === selectedCategory);

  const formatPrice = (price) => {
    const priceStr = price.toString();
    const formatted = priceStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return formatted + " so'm";
  };

  return (
    <>
      <h3
        style={{
          marginTop: "-15px",
          marginLeft: "-5px",
          fontWeight: "bold",
          fontFamily: "sans-serif",
          marginBottom: "0px",
          fontSize: "25px",
        }}
      >
        Taomlar sozlamasi
      </h3>
      <div className="menu-container">
        <section className="menu">
          <nav className="menu-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                className={
                  selectedCategory === cat
                    ? "CatButton active"
                    : "main-catButton"
                }
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

          <div className="menu-items">
            <article className="menu-card">
              <div className="menu-addCard" onClick={() => setShowModal(true)}>
                <button className="addMenu">+</button>
                <h3 style={{ margin: "5px 0px 0px 0px" }}>Taom qoshish</h3>
              </div>
            </article>
            {filteredMenu.map((i) => (
              <article key={i.id}>
                <div className="menu-addCard">
                  <img className="menu-cardIMG" src={i.image} alt={i.name} />
                  <h3 style={{ margin: "5px 0px 0px -15px", paddingLeft: "5px", textAlign: "center" }}>
                    {i.name}
                  </h3>
                  <div className="menu-cardTime">
                    <img style={{ width: "13px" }} src="/clock-regular.svg" alt="clock" />
                    <p style={{ margin: "0px", fontSize: "13px" }}>
                      {i.time ? `${i.time} min` : "Vaqti yoq"}
                    </p>
                  </div>
                  <h3 style={{ margin: "0px", marginBottom: "-10px" }}>
                    {formatPrice(i.price)}
                  </h3>
                  <div className="menu-cardEditButtons">
                    <button className="menu-cardEditButtons1" onClick={() => handleDelete(i.id)}>
                      🗑
                    </button>
                    <button className="menu-cardEditButtons2" onClick={() => handleEdit(i)}>
                      ✏️
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {showModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>{editing ? "Taomni tahrirlash" : "Yangi taom qo'shish"}</h2>
                <input
                  type="text"
                  placeholder="Taom nomi"
                  className="modal-input"
                  value={productName}
                  onChange={(e) => setProductNAme(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Narxi"
                  className="modal-input"
                  value={productPrice}
                  onChange={(e) =>setProductPrice(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Vaqti"
                  className="modal-input"
                  value={dishes.time}
                  onChange={(e) => setDishes({ ...dishes, time: e.target.value })}
                />
                <input
                  type="file"
                  placeholder="Rasm URL"
                  className="modal-input"
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.files[0])}
                />
                <select
                  className="modal-input"
                  value={productCategoryID}
                  onChange={(e) => setProductCategoryId(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <br />
                <div className="modal-buttons-box">
                  <button className="modal-buttons1" onClick={handleAddDish}>
                    {editing ? "Saqlash" : "Qoshish"}
                  </button>
                  <button
                    className="modal-buttons2"
                    onClick={() => {
                      setShowModal(false);
                      setEditing(false);
                      setDishes({
                        id: null,
                        name: "",
                        time: "",
                        price: "",
                        image: "",
                        category: "Hammasi",
                      });
                    }}
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
