import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import "./Cadastro.css";

const Cadastro = () => {
  const [tipoPerfil, setTipoPerfil] = useState(null);
  const [categoriasBanco, setCategoriasBanco] = useState([]);
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fotoInputRef = useRef(null);

  const navigate = useNavigate();

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    mode: "onChange"
  });

  const senhaAtual = watch("password");

  const buscarEnderecoPorCep = async (cep) => {
    const cepLimpo = String(cep).replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await res.json();
      if (dados.erro) {
        toast.error('CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }
      setValue('street', dados.logradouro || '');
      setValue('neighborhood', dados.bairro || '');
      setValue('city', dados.localidade || '');
      setValue('state', dados.uf || '');
    } catch {
      toast.error('Não foi possível buscar o CEP. Verifique sua conexão.');
    }
  };

  useEffect(() => {
    const buscarCategorias = async () => {
      try {
        const response = await api.get("/api/category");
        setCategoriasBanco(response.data);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      }
    };
    buscarCategorias();
  }, []);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const documentoLimpo = data.documento.replace(/\D/g, "");
      const telefoneLimpo = data.phone.replace(/\D/g, "");
      const cepLimpo = data.zipCode.replace(/\D/g, "");

      let dataFormatada = data.birthDate;
      if (data.birthDate && data.birthDate.includes('-')) {
        const [ano, mes, dia] = data.birthDate.split('-');
        dataFormatada = `${dia}/${mes}/${ano}`;
      }

      const usuarioPayload = {
        name: data.name,
        email: data.email,
        password: data.password,
        birthDate: dataFormatada,
        phone: telefoneLimpo,
        userType: tipoPerfil,
        registryId: documentoLimpo,
        enterprise: tipoPerfil === "PROFESSIONAL" ? data.companyName?.trim() : null,
        categoriesIds: tipoPerfil === "PROFESSIONAL" && data.categoryId ? [Number(data.categoryId)] : [],
        address: {
          street: data.street,
          number: data.number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: cepLimpo,
        }
      };

      const response = await api.post("/api/user", usuarioPayload);

      // Se selecionou foto, faz login automático para obter o token e então faz o upload
      if (fotoFile && response.data?.id) {
        try {
          const loginRes = await api.post("/auth/login", {
            email: data.email,
            password: data.password,
          });

          if (loginRes.data?.token) {
            const formData = new FormData();
            formData.append('foto', fotoFile);
            await api.post(`/api/user/${response.data.id}/photo`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${loginRes.data.token}`,
              },
            });
          }
        } catch (fotoErr) {
          console.error('Erro ao enviar foto:', fotoErr);
          // Não bloqueia o cadastro — foto pode ser adicionada depois no EditarPerfil
        }
      }

      setMostrarModalSucesso(true);

      setTimeout(() => {
        navigate("/login");
      }, 3000);

      reset();
    } catch (error) {
      setIsSubmitting(false);
      const mensagemErro = error.response?.data?.message || "Erro no cadastro. Verifique os dados.";
      toast.error(mensagemErro);
    }
  };

  if (!tipoPerfil) {
    return (
      <div className="cadastro-container">
        <div className="escolha-perfil-card">
          <h2 className="title-serif">Como deseja usar o ConectaPro?</h2>
          <div className="cards-container">
            <button className="perfil-card" onClick={() => setTipoPerfil("CLIENT")}>
              <i className="bi bi-person-badge"></i>
              <h3>Quero Contratar</h3>
              <span>Procuro profissionais para serviços</span>
            </button>
            <button className="perfil-card profissional" onClick={() => setTipoPerfil("PROFESSIONAL")}>
              <i className="bi bi-tools"></i>
              <h3>Quero Trabalhar</h3>
              <span>Quero oferecer os meus serviços</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">

      {mostrarModalSucesso && (
        <div className="modal-overlay">
          <div className="modal-sucesso">
            <i className="bi bi-check-circle-fill icon-sucesso"></i>
            <h2 className="title-serif">Cadastro Realizado!</h2>
            <p>Usuário cadastrado com sucesso.<br/>Você será direcionado para o login em instantes...</p>
          </div>
        </div>
      )}

      <div className="form-card">
        <div className="form-header">
          <div className="cadastro-avatar-wrapper" onClick={() => fotoInputRef.current.click()} title="Clique para adicionar uma foto">
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto de perfil" className="cadastro-avatar-img" />
            ) : (
              <div className="cadastro-avatar-placeholder">
                <i className="bi bi-camera-fill"></i>
              </div>
            )}
            <div className="cadastro-avatar-overlay">
              <i className="bi bi-camera-fill"></i>
            </div>
          </div>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setFotoFile(file);
              setFotoPreview(URL.createObjectURL(file));
            }}
          />
          <div className="header-titles">
            <h2 className="title-serif">{tipoPerfil === "CLIENT" ? "Cadastro de Cliente" : "Cadastro de Profissional"}</h2>
            <p className="subtitle">
              {tipoPerfil === "CLIENT"
                ? "Crie sua conta para encontrar e contratar os melhores profissionais."
                : "Junte-se à nossa rede e conecte-se com clientes que precisam do seu talento."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-columns">

            <div className="form-left">

              <div className="input-group w-100">
                <label>Nome Completo</label>
                <input {...register("name", { required: true })} placeholder="Digite seu nome completo" />
              </div>

              {tipoPerfil === "PROFESSIONAL" && (
                <div className="input-group w-100">
                  <label>Nome da Empresa (opcional)</label>
                  <input {...register("companyName")} placeholder="Ex: Conecta Reparos LTDA" />
                </div>
              )}

              <div className="input-group w-100">
                <label>E-mail</label>
                <input type="email" className="input-email-bg" {...register("email", { required: true })} placeholder="maria@gmail.com" />
              </div>

              {tipoPerfil === "PROFESSIONAL" ? (
                <div className="input-group w-100">
                  <label>CNPJ / CPF</label>
                  <Controller
                    name="documento"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <IMaskInput
                        {...field}
                        mask={[
                          { mask: '000.000.000-00' },
                          { mask: '00.000.000/0000-00' }
                        ]}
                        onAccept={(value) => field.onChange(value)}
                        placeholder="00.000.000/0000-00 ou 000.000.000-00"
                      />
                    )}
                  />
                </div>
              ) : (
                <div className="row">
                  <div className="input-group w-50">
                    <label>CPF</label>
                    <Controller
                      name="documento"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <IMaskInput {...field} mask="000.000.000-00" onAccept={(value) => field.onChange(value)} placeholder="000.000.000-00" />
                      )}
                    />
                  </div>
                  <div className="input-group w-50">
                    <label>Data de Nascimento</label>
                    <input type="date" className="input-date-placeholder" {...register("birthDate", { required: true })} />
                  </div>
                </div>
              )}

              {tipoPerfil === "PROFESSIONAL" ? (
                <div className="row">
                  <div className="input-group w-50">
                    <label>Telefone / WhatsApp</label>
                    <Controller
                      name="phone"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <IMaskInput {...field} mask="(00) 00000-0000" onAccept={(value) => field.onChange(value)} placeholder="(00) 00000-0000" />
                      )}
                    />
                  </div>
                  <div className="input-group w-50">
                    <label>Data de Nascimento</label>
                    <input type="date" className="input-date-placeholder" {...register("birthDate", { required: true })} />
                  </div>
                </div>
              ) : (
                <div className="input-group w-100">
                  <label>Telefone</label>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <IMaskInput {...field} mask="(00) 00000-0000" onAccept={(value) => field.onChange(value)} placeholder="(00) 00000-0000" />
                    )}
                  />
                </div>
              )}

              <div className="row">
                <div className="input-group w-50">
                  <label>Senha</label>
                  <div className="password-wrapper">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      className={errors.password ? "input-error" : ""}
                      {...register("password", {
                        required: "A senha é obrigatória",
                        minLength: { value: 6, message: "Mínimo 6 dígitos" }
                      })}
                      placeholder="••••••"
                    />
                    <i
                      className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"} password-icon`}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    ></i>
                  </div>
                  {errors.password && <span className="error-message">{errors.password.message}</span>}
                </div>

                <div className="input-group w-50">
                  <label>Confirmar Senha</label>
                  <div className="password-wrapper">
                    <input
                      type={mostrarConfirmarSenha ? "text" : "password"}
                      className={errors.confirmarPassword ? "input-error" : ""}
                      placeholder="••••••"
                      {...register("confirmarPassword", {
                        required: "A confirmação é obrigatória",
                        validate: (value) => value === senhaAtual || "As senhas não conferem"
                      })}
                    />
                    <i
                      className={`bi ${mostrarConfirmarSenha ? "bi-eye-slash" : "bi-eye"} password-icon`}
                      onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    ></i>
                  </div>
                  {errors.confirmarPassword && <span className="error-message">{errors.confirmarPassword.message}</span>}
                </div>
              </div>

            </div>

            <div className="form-right">

              {tipoPerfil === "PROFESSIONAL" && (
                <div className="input-group w-100">
                  <label>Especialidade</label>
                  <select {...register("categoryId", { required: true })}>
                    <option value="">Selecione a sua área...</option>
                    {categoriasBanco.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-group w-100">
                <label>CEP</label>
                <Controller
                  name="zipCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <IMaskInput {...field} mask="00000-000" onAccept={(value) => field.onChange(value)} placeholder="00000-000" onBlur={(e) => buscarEnderecoPorCep(e.target.value)} />
                  )}
                />
              </div>

              <div className="row">
                <div className="input-group w-70">
                  <label>Rua</label>
                  <input {...register("street", { required: true })} placeholder="Ex: Rua Jardim Veneza" />
                </div>
                <div className="input-group w-30">
                  <label>Número</label>
                  <input {...register("number")} placeholder="123" />
                </div>
              </div>

              <div className="input-group w-100">
                <label>Bairro</label>
                <input {...register("neighborhood", { required: true })} placeholder="Ex: Boa Viagem" />
              </div>

              <div className="row">
                <div className="input-group w-70">
                  <label>Cidade</label>
                  <input {...register("city", { required: true })} placeholder="Ex: Recife" />
                </div>
                <div className="input-group w-30">
                  <label>Estado (UF)</label>
                  <select {...register("state", { required: true })}>
                    <option value="">UF</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AM">AM</option>
                    <option value="AP">AP</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MG">MG</option>
                    <option value="MS">MS</option>
                    <option value="MT">MT</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="PR">PR</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="RS">RS</option>
                    <option value="SC">SC</option>
                    <option value="SE">SE</option>
                    <option value="SP">SP</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
              </div>

              <div className="terms-container">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="termos"
                    {...register("aceitouTermos", { required: "Você precisa aceitar os termos de uso" })}
                  />
                  <label htmlFor="termos">
                    Eu li e aceito os <Link to="/termos-de-uso" target="_blank">Termos de Uso</Link>
                  </label>
                </div>
                {errors.aceitouTermos && (
                  <span className="error-message">
                    <i className="bi bi-exclamation-circle"></i> {errors.aceitouTermos.message}
                  </span>
                )}
              </div>

            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-centered"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="bi bi-arrow-repeat spinner-icon"></i> Cadastrando...
              </>
            ) : (
              "Finalizar Cadastro"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;