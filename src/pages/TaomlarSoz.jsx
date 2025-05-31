import React, { useEffect, useState } from "react";
import "./styles/TaomlarSoz.css";
import axios from "axios";

export default function TaomlarSoz() {
  const [menu, setMenu] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newCategory, setNewCategory] = useState("Hammasi");
  const [dishes, setDishes] = useState({
    id: null,
    name: "",
    date: "",
    price: "",
    image: null,
    categoryId: null,
    createdAt: null,
    category: null,
  });
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMenu = () => {
    setLoading(true);
    axios("https://suddocs.uz/product")
      .then((res) => setMenu(res.data))
      .catch((err) => console.error("Menyu olishda xatolik:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    setLoading(true);
    axios("https://suddocs.uz/category")
      .then((res) => setCategoryList(res.data))
      .catch((err) => console.error("Kategoriya olishda xatolik:", err))
      .finally(() => setLoading(false));
  }, []);

  const resetDish = () => {
    setDishes({
      id: null,
      name: "",
      date: "",
      price: "",
      image: null,
      categoryId: null,
      createdAt: null,
      category: null,
    });
  };

  const handleAddDish = () => {
    if (
      !dishes.name ||
      isNaN(parseInt(dishes.price)) ||
      (!dishes.image && !editing)
    ) {
      alert("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    if (editing) {
      const formdata = new FormData();
      formdata.append("name", dishes.name);
      formdata.append("price", parseInt(dishes.price));
      formdata.append("date", dishes.date);
      formdata.append("categoryId", dishes.categoryId);

      if (typeof dishes.image !== "string") {
        formdata.append("image", dishes.image);
      }

      axios
        .put(`https://suddocs.uz/product/${dishes.id}`, formdata)
        .then(() => {
          fetchMenu();
          setShowModal(false);
          setEditing(false);
          resetDish();
        })
        .catch((err) => {
          console.error("Xatolik tahrirlashda:", err);
        });
    } else {
      const formdata = new FormData();
      formdata.append("name", dishes.name);
      formdata.append("price", parseInt(dishes.price));
      formdata.append("date", dishes.date);
      formdata.append("image", dishes.image);
      const catId = parseInt(dishes.categoryId);
      if (isNaN(catId)) {
        alert("Iltimos, kategoriya tanlang.");
        return;
      }
      formdata.append("categoryId", catId);

      axios.post("https://suddocs.uz/product", formdata).then(() => {
        fetchMenu();
        setShowModal(false);
        setEditing(false);
        resetDish();
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Taomini o'chirishni istaysizmi?")) {
      axios
        .delete(`https://suddocs.uz/product/${id}`)
        .then(() => fetchMenu())
        .catch((err) => {
          alert("Bu taom o'chirib bo'lmaydi. Balki u zakazga bog'langan.");
          console.error("O'chirishda xatolik:", err);
        });
    }
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm("Kategoriyani o'chirishni istaysizmi?")) {
      axios
        .delete(`https://suddocs.uz/category/${id}`)
        .then(() => {
          axios("https://suddocs.uz/category").then((res) =>
            setCategoryList(res.data)
          );
          setNewCategory("Hammasi");
        })
        .catch((err) => {
          alert("Kategoriyani o'chirib bo'lmadi. Balki u taomga bog'langan.");
          console.error("Kategoriya o'chirishda xatolik:", err);
        });
    }
  };

  const handleEdit = (dish) => {
    setDishes({
      id: dish.id,
      name: dish.name,
      date: dish.date,
      price: dish.price,
      image: dish.image,
      categoryId: dish.categoryId ?? null,
      createdAt: dish.createdAt ?? null,
    });
    setEditing(true);
    setShowModal(true);
  };

  const filteredMenu =
    newCategory === "Hammasi"
      ? menu
      : menu.filter((item) => item.category?.name === newCategory);

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
            {["Hammasi", ...categoryList.map((cat) => cat.name)].map((cat) => {
              const realCat = categoryList.find((c) => c.name === cat);
              return (
                <div
                  key={cat}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <button
                    className={
                      newCategory === cat
                        ? "CatButton active"
                        : "main-catButton"
                    }
                    onClick={() => setNewCategory(cat)}
                  >
                    {cat}
                  </button>
                  {cat !== "Hammasi" && (
                    <button
                      onClick={() => handleDeleteCategory(realCat?.id)}
                      style={{
                        marginLeft: "5px",
                        paddingTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        border: "0.5px solid rgb(0, 0, 0)",
                        background: "transparent",
                        color: "red",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="menu-items">
              <article className="menu-card">
                <div
                  className="menu-addCard"
                  onClick={() => setShowModal(true)}
                >
                  <button className="addMenu">+</button>
                  <h3 style={{ margin: "5px 0px 0px 0px" }}>Taom qoshish</h3>
                </div>
              </article>
              {filteredMenu.map((i) => (
                <article key={i.id}>
                  <div className="menu-addCard">
                    <img
                      className="menu-cardIMG"
                      src={`https://suddocs.uz${i.image}`}
                      alt={i.name}
                    />
                    <h3
                      style={{
                        margin: "5px 0px 0px -15px",
                        paddingLeft: "5px",
                        textAlign: "center",
                      }}
                    >
                      {i.name}
                    </h3>
                    <div className="menu-cardTime">
                      <img
                        style={{ width: "13px" }}
                        src="/clock-regular.svg"
                        alt="clock"
                      />
                      <p style={{ margin: "0px", fontSize: "13px" }}>
                        {i.date ? `${i.date} min` : "Vaqti yoq"}
                      </p>
                    </div>
                    <h3 style={{ margin: "0px", marginBottom: "-10px" }}>
                      {formatPrice(i.price)}
                    </h3>
                    <div className="menu-cardEditButtons">
                      <button
                        className="menu-cardEditButtons1"
                        onClick={() => handleDelete(i.id)}
                      >
                        🗑
                      </button>
                      <button
                        className="menu-cardEditButtons2"
                        onClick={() => handleEdit(i)}
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>{editing ? "Taomni tahrirlash" : "Yangi taom qo'shish"}</h2>
                {editing && typeof dishes.image === "string" && (
                  <img
                    src={`https://suddocs.uz${dishes.image}`}
                    alt="Current"
                    style={{
                      width: "100px",
                      marginBottom: "10px",
                      borderRadius: "8px",
                    }}
                  />
                )}

                <input
                  type="text"
                  placeholder="Taom nomi"
                  className="modal-input"
                  value={dishes.name || ""}
                  onChange={(e) =>
                    setDishes({ ...dishes, name: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Narxi"
                  className="modal-input"
                  value={dishes.price || ""}
                  onChange={(e) =>
                    setDishes({ ...dishes, price: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Tayyorlanish vaqti (min)"
                  className="modal-input"
                  value={dishes.date || ""}
                  onChange={(e) =>
                    setDishes({ ...dishes, date: e.target.value })
                  }
                />

                <input
                  type="file"
                  className="modal-input"
                  onChange={(e) =>
                    setDishes({ ...dishes, image: e.target.files[0] })
                  }
                />

                <select
                  className="modal-input"
                  style={{ width: "21.4em" }}
                  value={dishes.categoryId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDishes({
                      ...dishes,
                      categoryId: val === "" ? null : parseInt(val),
                    });
                  }}
                >
                  <option value="">Kategoriya tanlang</option>
                  {categoryList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "10px", marginTop: "0px" }}>
                  <input
                    type="text"
                    placeholder="Yangi kategoriya nomi"
                    className="modal-input"
                    style={{ width: "14.6em" }}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!newCategory.trim()) {
                        alert("Kategoriya nomini kiriting.");
                        return;
                      }

                      axios
                        .post("https://suddocs.uz/category", {
                          name: newCategory.trim(),
                        })
                        .then((res) => {
                          const added = res.data;
                          setCategoryList((prev) => [...prev, added]);
                          setDishes((prev) => ({
                            ...prev,
                            categoryId: added.id,
                          }));
                          setNewCategory("");
                        })
                        .catch((err) => {
                          console.error("Kategoriya qo'shishda xatolik:", err);
                          alert("Kategoriya qo'shilmadi.");
                        });
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      height: "3em",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Qo'shish
                  </button>
                </div>

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
                      resetDish();
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
